import type { Request, Response, NextFunction } from "express";
import axios from "axios";
import { env } from "../../config/env.js";
import redisClient from "../../config/redis.js";
import { AppError } from "../../utils/AppError.js";
import { createModuleLogger, logError } from "../../utils/logger.js";

const log = createModuleLogger("webrtc-controller");

export async function getTurnCredentials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.userId;
        if (!userId) {
            throw AppError.unauthorized("User ID is missing");
        }

        if (!env.METERED_DOMAIN || !env.METERED_API_KEY) {
            log.warn("METERED_DOMAIN or METERED_API_KEY is not configured");
            res.json([]);
            return;
        }

        const cacheKey = `webrtc:turn:${userId}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) {
            res.json(JSON.parse(cached));
            return;
        }

        const url = `https://${env.METERED_DOMAIN}/api/v1/turn/credentials`;
        const response = await axios.get(url, {
            params: { apiKey: env.METERED_API_KEY },
        });

        const credentials = response.data;
        
        // Cache for a bit under typical Metered expiry (e.g. they might expire in 24h, we cache for 1h or 12h)
        // Let's cache for 1 hour (3600s) to be safe.
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(credentials));

        res.json(credentials);
    } catch (err) {
        logError(err, { context: "get-turn-credentials", userId: req.userId });
        next(AppError.internal("Failed to retrieve TURN credentials"));
    }
}
