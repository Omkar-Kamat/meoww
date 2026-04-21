import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "../config/redis.js";

/**
 * Creates a RedisStore for a given limiter.
 * Each limiter gets its own key prefix so their counters never collide.
 *
 * Prefix format: "rl:<name>:" — e.g. "rl:auth:", "rl:signup:"
 */
const makeStore = (name) =>
    new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: `rl:${name}:`,
    });

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => ipKeyGenerator(req),
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore("auth"),
    message: { error: "Too many attempts, please try again in 15 minutes." },
});

export const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => ipKeyGenerator(req),
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore("refresh"),
    message: { error: "Too many refresh attempts. Try again later." },
});

export const resendOtpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    keyGenerator: (req) => ipKeyGenerator(req),
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore("resend-otp"),
    message: { error: "Too many OTP requests, please wait before requesting again." },
});

export const turnLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 200,
    keyGenerator: (req) => ipKeyGenerator(req),
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore("turn"),
    message: { error: "Too many TURN credential requests." },
});

export const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => ipKeyGenerator(req),
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore("signup"),
    message: { error: "Too many signup attempts, please try again later." },
});

export const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    keyGenerator: (req) => ipKeyGenerator(req),
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore("forgot-password"),
    message: { error: "Too many password reset requests. Please try again in an hour." },
});

/**
 * Keyed by userId (not IP) for authenticated endpoints — more precise
 * than IP since multiple users may share a NAT or proxy.
 * Falls back to IP if userId is somehow missing.
 */
export const updateProfileLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => req.user?.userId ?? ipKeyGenerator(req),
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore("update-profile"),
    message: { error: "Too many profile update requests. Please try again later." },
});