import { createHmac } from "crypto";
import type { Request, Response, NextFunction } from "express";
import redisClient from "../../config/redis.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import { logError } from "../../utils/logger.js";

const CREDENTIAL_TTL_SECONDS = 3600;

interface IceServer {
    urls: string;
    username?: string;
    credential?: string;
}

interface TurnCredentialsResponse {
    iceServers: IceServer[];
    expiresAt: number;
}

function generateTurnCredentials(userId: string): TurnCredentialsResponse {
    const expiresAt = Math.floor(Date.now() / 1000) + CREDENTIAL_TTL_SECONDS;
    const username = `${expiresAt}:${userId}`;
    const credential = createHmac("sha1", env.TURN_SECRET).update(username).digest("base64");

    return {
        iceServers: [
            { urls: `stun:${env.TURN_DOMAIN}:${env.TURN_PORT}` },
            { urls: `turn:${env.TURN_DOMAIN}:${env.TURN_PORT}?transport=udp`, username, credential },
            { urls: `turn:${env.TURN_DOMAIN}:${env.TURN_PORT}?transport=tcp`, username, credential },
            { urls: `turns:${env.TURN_DOMAIN}:${env.TURN_TLS_PORT}?transport=tcp`, username, credential },
        ],
        expiresAt,
    };
}

export async function getTurnCredentials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.userId;
        if (!userId) {
            throw AppError.unauthorized("User ID is missing");
        }

        const cacheKey = `webrtc:turn:${userId}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            res.json(JSON.parse(cached) as TurnCredentialsResponse);
            return;
        }

        const credentials = generateTurnCredentials(userId);

        const cacheTtlSeconds = credentials.expiresAt - Math.floor(Date.now() / 1000);
        await redisClient.setEx(cacheKey, cacheTtlSeconds, JSON.stringify(credentials));

        res.json(credentials);
    } catch (err) {
        logError(err, { context: "get-turn-credentials", userId: req.userId });
        next(err instanceof AppError ? err : AppError.internal("Failed to retrieve TURN credentials"));
    }
}
