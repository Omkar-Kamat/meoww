import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import redisClient from "../config/redis.js";
import { allowedOrigins } from "../config/cors.js";
import { socketAuthMiddleware } from "./socket.auth.js";
import { createModuleLogger } from "../utils/logger.js";
import * as matchmakingService from "../modules/matchmaking/matchmaking.service.js";
import * as webrtcService from "../modules/webrtc/webrtc.service.js";
import * as sessionStore from "./session.store.js";
import * as matchmakingStore from "../modules/matchmaking/matchmaking.store.js";
import { registerMatchmakingHandlers } from "../modules/matchmaking/matchmaking.gateway.js";
import { registerWebrtcHandlers } from "../modules/webrtc/webrtc.gateway.js";

const log = createModuleLogger("socket-server");
const TOKEN_REFRESH_WARNING_MS = 2 * 60 * 1000;

export async function createSocketServer(httpServer: HttpServer): Promise<Server> {
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

    await attachRedisAdapter(io);

    io.use(socketAuthMiddleware);

    return io;
}

async function attachRedisAdapter(io: Server): Promise<void> {
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    log.info("Redis adapter connected");
}

export function mountGateways(io: Server): void {
    async function checkSocketLive(socketId: string): Promise<boolean> {
        const liveSockets = await io.in(socketId).fetchSockets();
        return liveSockets.length > 0;
    }

    const mmService = matchmakingService.createMatchmakingService(checkSocketLive);

    async function getPeerSocketId(userId: string): Promise<string | null> {
        const roomId = await matchmakingStore.getUserRoom(userId);
        if (!roomId) return null;
        const peerId = await matchmakingStore.getPeerId(roomId, userId);
        if (!peerId) return null;
        return sessionStore.getUserSocket(peerId);
    }

    const rtcService = webrtcService.createWebrtcService(getPeerSocketId);

    io.on("connection", (socket: Socket) => {
        log.info({ userId: socket.userId }, "User connected");

        void handleConnectionSetup(io, socket);

        registerMatchmakingHandlers(mmService, socket);
        registerWebrtcHandlers(rtcService, socket);

        socket.on("disconnect", () => {
            log.info({ userId: socket.userId }, "User disconnected");
            clearTokenTimers(socket);
            if (socket.userId) {
                const userId = socket.userId;
                setTimeout(() => {
                    void (async () => {
                        try {
                            const currentSocketId = await sessionStore.getUserSocket(userId);
                            if (currentSocketId && currentSocketId !== socket.id) {
                                return;
                            }
                            const actions = await mmService.handleDisconnect(userId);
                            for (const action of actions) {
                                io.to(action.target).emit(action.event, action.payload);
                            }
                        } catch (err: unknown) {
                            log.error(
                                { err, userId, event: "disconnect" },
                                "Error in matchmaking disconnect handler",
                            );
                        }
                    })();
                }, 3000);
            }
        });
    });
}

async function handleConnectionSetup(io: Server, socket: Socket): Promise<void> {
    if (!socket.userId) return;

    const oldSocketId = await sessionStore.getUserSocket(socket.userId);
    if (oldSocketId && oldSocketId !== socket.id) {
        io.to(oldSocketId).emit("session-terminated", { reason: "another_session_detected" });
        io.in(oldSocketId).disconnectSockets(true);
    }

    await sessionStore.setUserSocket(socket.userId, socket.id);

    scheduleTokenExpiry(socket);
}

function scheduleTokenExpiry(socket: Socket): void {
    if (!socket.tokenExp) return;

    const nowMs = Date.now();
    const expiresInMs = socket.tokenExp * 1000 - nowMs;

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
        socket.tokenWarningTimer = setTimeout(() => {
            if (socket.connected) {
                socket.emit("token-expiring-soon", {
                    code: "TOKEN_EXPIRING_SOON",
                    message: "Your session is about to expire. Please refresh.",
                    expiresInMs: TOKEN_REFRESH_WARNING_MS,
                });
            }
        }, warningInMs);
    }

    socket.tokenExpiryTimer = setTimeout(() => {
        if (socket.connected) {
            socket.emit("token-expired", {
                code: "TOKEN_EXPIRED",
                message: "Session expired. Please refresh and reconnect.",
            });
            socket.disconnect(true);
        }
    }, expiresInMs);
}

function clearTokenTimers(socket: Socket): void {
    if (socket.tokenWarningTimer) {
        clearTimeout(socket.tokenWarningTimer);
        socket.tokenWarningTimer = undefined;
    }
    if (socket.tokenExpiryTimer) {
        clearTimeout(socket.tokenExpiryTimer);
        socket.tokenExpiryTimer = undefined;
    }
}
