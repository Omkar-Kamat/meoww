// requireAuth(req, res, next) — verifies JWT from cookie/header, attaches req.userId
// optionalAuth(req, res, next) — same, but doesn't reject if token is absent

// src/middleware/auth.middleware
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

function extractToken(req: Request): string | undefined {
    const cookies = req.cookies as Record<string, string> | undefined;
    const cookieToken = cookies?.access_token;
    if (cookieToken) return cookieToken;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice("Bearer ".length);
    }

    return undefined;
}

function verifyToken(token: string): string {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    if (typeof decoded === "string" || !("userId" in decoded)) {
        throw new AppError("Invalid token payload", 401, "INVALID_TOKEN");
    }

    return decoded.userId as string;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
    const token = extractToken(req);

    if (!token) {
        next(AppError.unauthorized("Access denied. No token provided.", "NO_TOKEN"));
        return;
    }

    try {
        req.userId = verifyToken(token);
        next();
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            next(AppError.unauthorized("Access token expired", "TOKEN_EXPIRED"));
            return;
        }
        if (err instanceof JsonWebTokenError) {
            next(AppError.unauthorized("Invalid token", "INVALID_TOKEN"));
            return;
        }
        next(err);
    }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
    const token = extractToken(req);

    if (!token) {
        next();
        return;
    }

    try {
        req.userId = verifyToken(token);
    } catch {
        // token present but invalid/expired — proceed unauthenticated rather than reject
    }

    next();
}
