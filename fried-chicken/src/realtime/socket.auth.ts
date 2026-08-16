// socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) — verifies JWT on handshake, attaches socket.userId

// src/realtime/socket.auth.ts
import type { Socket } from "socket.io";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { parseCookie } from "cookie";
import { env } from "../config/env.js";

interface SocketAuthError extends Error {
    data: { code: string; message: string };
}

function createAuthError(code: string, message: string): SocketAuthError {
    const err = new Error("Authentication error") as SocketAuthError;
    err.data = { code, message };
    return err;
}

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): void {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
        next(createAuthError("NO_COOKIE", "No cookies found."));
        return;
    }

    const parsedCookies = parseCookie(cookieHeader);
    const token = parsedCookies.access_token;

    if (!token) {
        next(createAuthError("NO_TOKEN", "No access token found."));
        return;
    }

    try {
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

        if (
            typeof decoded === "string" ||
            !("userId" in decoded) ||
            typeof decoded.userId !== "string"
        ) {
            next(createAuthError("TOKEN_INVALID", "Invalid access token payload."));
            return;
        }

        socket.userId = decoded.userId;
        if (typeof decoded.exp === "number") {
            socket.tokenExp = decoded.exp;
        }

        next();
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            next(createAuthError("TOKEN_EXPIRED", "Access token expired. Refresh and reconnect."));
            return;
        }
        next(createAuthError("TOKEN_INVALID", "Invalid access token."));
    }
}
