// createRateLimiter(options: RateLimitOptions) — factory wrapping express-rate-limit + Redis store
// authRateLimiter — exported preconfigured limiter for login/signup routes
// apiRateLimiter — exported general-purpose limiter

// src/middleware/rateLimit.middleware
import rateLimit, { ipKeyGenerator, type Options } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import type { Request } from "express";
import redisClient from "../config/redis.js";
import { createModuleLogger } from "../utils/logger.js";

const log = createModuleLogger("rate-limit");

interface RateLimitOptions {
    name: string;
    windowMs: number;
    max: number;
    message: string;
    perUser?: boolean;
    keyGenerator?: (req: Request) => string;
}

function makeStore(name: string): RedisStore {
    return new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
        prefix: `rl:${name}:`,
    });
}

function makeKeyGenerator(perUser: boolean) {
    return (req: Request): string => {
        if (perUser && req.userId) {
            return `user:${req.userId}`;
        }
        return ipKeyGenerator(req.ip ?? "unknown");
    };
}

export function createRateLimiter(options: RateLimitOptions): ReturnType<typeof rateLimit> {
    const { name, windowMs, max, message, perUser = false, keyGenerator } = options;

    const config: Partial<Options> = {
        windowMs,
        max,
        keyGenerator: keyGenerator ?? makeKeyGenerator(perUser),
        standardHeaders: true,
        legacyHeaders: false,
        // NOTE: requires redisClient.connect() to have been called before
        // the first request hits this middleware. Safe under the normal
        // index.ts boot sequence; do not import this module from a script
        // or test that doesn't also connect Redis first.
        store: makeStore(name),
        message: { error: message },
        handler: (req, res, _next, opts) => {
            log.warn(
                { path: req.originalUrl, key: makeKeyGenerator(perUser)(req) },
                "Rate limit exceeded",
            );
            res.status(opts.statusCode).json(opts.message);
        },
    };

    return rateLimit(config);
}

export const apiRateLimiter = createRateLimiter({
    name: "api",
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please slow down.",
    perUser: true,
});

export const authRateLimiter = createRateLimiter({
    name: "auth",
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many attempts, please try again in 15 minutes.",
    perUser: false,
});

export const resetPasswordRateLimiter = createRateLimiter({
    name: "reset-password",
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many password reset attempts, please try again later.",
    keyGenerator: (req: Request) => {
        const ip = req.ip ?? "unknown";
        const body = req.body as Record<string, unknown> | undefined;
        const email = typeof body?.email === "string" ? body.email : undefined;
        return email ? `ip:${ip}:email:${email}` : ip;
    },
});

export const otpRateLimiter = createRateLimiter({
    name: "otp",
    windowMs: 15 * 60 * 1000,
    max: 5, // OTP resends are sensitive, limit to 5 per 15 min per IP/email
    message: "Too many OTP requests, please try again later.",
    keyGenerator: (req: Request) => {
        const ip = req.ip ?? "unknown";
        const body = req.body as Record<string, unknown> | undefined;
        const identifier = typeof body?.identifier === "string" ? body.identifier : undefined;
        return identifier ? `ip:${ip}:id:${identifier}` : ip;
    },
});
