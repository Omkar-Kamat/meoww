import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import * as matchmakingService from "./matchmaking.service.js";
import { allowedOrigins } from "../config/cors.js";
import redisClient from "../config/redis.js";

const TOKEN_REFRESH_WARNING_MS = 2 * 60 * 1000;

function safeHandler(socket, eventName, fn) {
    return (...args) => {
        Promise.resolve(fn(...args)).catch((err) => {
            console.error(
                `[socket] Error in "${eventName}" handler for user ${socket.userId}:`,
                err
            );
            socket.emit("error", { message: "An unexpected error occurred." });
        });
    };
}

function scheduleTokenExpiry(socket, exp) {
    const nowMs       = Date.now();
    const expiresInMs = exp * 1000 - nowMs;

    if (expiresInMs <= 1000) {
        socket.emit("token-expired", {
            code: "TOKEN_EXPIRED",
            message: "Session expired. Please refresh and reconnect.",
        });
        socket.disconnect(true);
        return;
    }

    const warningInMs = expiresInMs - TOKEN_REFRESH_WARNING_MS;
    if (warningInMs > 0) {
        socket._tokenWarningTimer = setTimeout(() => {
            if (socket.connected) {
                socket.emit("token-expiring-soon", {
                    code: "TOKEN_EXPIRING_SOON",
                    message: "Your session is about to expire. Please refresh.",
                    expiresInMs: TOKEN_REFRESH_WARNING_MS,
                });
            }
        }, warningInMs);
    }

    socket._tokenExpiryTimer = setTimeout(() => {
        if (socket.connected) {
            socket.emit("token-expired", {
                code: "TOKEN_EXPIRED",
                message: "Session expired. Please refresh and reconnect.",
            });
            socket.disconnect(true);
        }
    }, expiresInMs);
}

function clearTokenTimers(socket) {
    if (socket._tokenWarningTimer) {
        clearTimeout(socket._tokenWarningTimer);
        socket._tokenWarningTimer = null;
    }
    if (socket._tokenExpiryTimer) {
        clearTimeout(socket._tokenExpiryTimer);
        socket._tokenExpiryTimer = null;
    }
}

export const initSocketServer = async (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed by CORS"));
                }
            },
            credentials: true,
        },
    });

    // ── Redis adapter ─────────────────────────────────────────────────────────
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log("[Socket.io] Redis adapter connected");

    // ── Give matchmaking service access to io ─────────────────────────────────
    matchmakingService.init(io);

    // ── Auth middleware ───────────────────────────────────────────────────────
    io.use((socket, next) => {
        const cookies = socket.handshake.headers.cookie;
        if (!cookies) {
            const err = new Error("Authentication error");
            err.data = { code: "NO_COOKIE", message: "No cookies found." };
            return next(err);
        }

        const parsedCookies = cookie.parse(cookies);
        const token = parsedCookies.access_token;

        if (!token) {
            const err = new Error("Authentication error");
            err.data = { code: "NO_TOKEN", message: "No access token found." };
            return next(err);
        }

        try {
            const decoded    = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            socket.userId    = decoded.userId;
            socket._tokenExp = decoded.exp;
            next();
        } catch (error) {
            const err  = new Error("Authentication error");
            err.data   = error.name === "TokenExpiredError"
                ? { code: "TOKEN_EXPIRED", message: "Access token expired. Refresh and reconnect." }
                : { code: "TOKEN_INVALID", message: "Invalid access token." };
            next(err);
        }
    });

    // ── Connection handler ────────────────────────────────────────────────────
    io.on("connection", async (socket) => {
        console.log(`User connected: ${socket.userId}`);

        // ── Duplicate session handling ────────────────────────────────────────
        // Look up any previously registered socket ID for this user in Redis.
        // Works cross-process — we don't need the socket object itself.
        const oldSocketId = await redisClient.get(`mm:usersocket:${socket.userId}`);
        if (oldSocketId && oldSocketId !== socket.id) {
            // Notify the old socket first, then force-disconnect it.
            // io.in().disconnectSockets() is handled by the Redis adapter
            // and reaches the socket even if it lives on another process.
            io.to(oldSocketId).emit("session-terminated", {
                reason: "another_session_detected",
            });
            await io.in(oldSocketId).disconnectSockets(true);
        }

        // Register the new socket ID — matchmaking handlers read this from Redis
        await redisClient.set(`mm:usersocket:${socket.userId}`, socket.id);

        if (socket._tokenExp) {
            scheduleTokenExpiry(socket, socket._tokenExp);
        }

        // ── Event handlers ────────────────────────────────────────────────────
        socket.on("search",        safeHandler(socket, "search",        ()     => matchmakingService.handleSearch(socket)));
        socket.on("offer",         safeHandler(socket, "offer",         (data) => matchmakingService.handleOffer(socket, data)));
        socket.on("answer",        safeHandler(socket, "answer",        (data) => matchmakingService.handleAnswer(socket, data)));
        socket.on("ice-candidate", safeHandler(socket, "ice-candidate", (data) => matchmakingService.handleIceCandidate(socket, data)));
        socket.on("skip",          safeHandler(socket, "skip",          ()     => matchmakingService.handleSkip(socket)));
        socket.on("stop-search",   safeHandler(socket, "stop-search",   ()     => matchmakingService.handleStopSearch(socket)));
        socket.on("send-message",  safeHandler(socket, "send-message",  (data) => matchmakingService.handleMessage(socket, data)));

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.userId}`);
            // clearTokenTimers runs locally — timers only exist on the process
            // that owns this socket, so no cross-process concern here.
            clearTokenTimers(socket);
            matchmakingService.handleDisconnect(socket);
        });
    });

    return io;
};