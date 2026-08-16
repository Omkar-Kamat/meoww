// errorHandler(err, req, res, next) — global error handler (Multer errors, AppError, unhandled)
// notFoundHandler(req, res) — 404 fallback for unmatched routes

// src/middleware/error.middleware
import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";
import { logError } from "../utils/logger.js";

interface ErrorResponseBody {
    success: false;
    message: string;
    code?: string;
    meta?: object;
    stack?: string;
}

function mapMulterError(err: MulterError): AppError {
    switch (err.code) {
        case "LIMIT_FILE_SIZE":
            return AppError.badRequest("File too large", "FILE_TOO_LARGE");
        case "LIMIT_UNEXPECTED_FILE":
            return AppError.badRequest("Unexpected file field", "UNEXPECTED_FILE");
        default:
            return AppError.badRequest(err.message, "UPLOAD_ERROR");
    }
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
    let appError: AppError;

    if (err instanceof AppError) {
        appError = err;
    } else if (err instanceof MulterError) {
        appError = mapMulterError(err);
    } else if (err instanceof Error) {
        appError = new AppError(err.message, 500, "INTERNAL_ERROR");
        if (err.stack !== undefined) {
            appError.stack = err.stack;
        }
        Object.assign(appError, { isOperational: false });
    } else {
        appError = new AppError("An unexpected error occurred", 500, "INTERNAL_ERROR");
        Object.assign(appError, { isOperational: false });
    }

    logError(err, {
        route: req.originalUrl,
        method: req.method,
        statusCode: appError.statusCode,
        code: appError.code,
    });

    const isOperational = appError.isOperational;
    const exposeMessage = isOperational || env.NODE_ENV !== "production";

    const body: ErrorResponseBody = {
        success: false,
        message: exposeMessage ? appError.message : "Internal Server Error",
    };

    if (appError.code) {
        body.code = appError.code;
    }
    if (isOperational && Object.keys(appError.meta).length > 0) {
        body.meta = appError.meta;
    }
    if (env.NODE_ENV !== "production" && appError.stack !== undefined) {
        body.stack = appError.stack;
    }

    res.status(appError.statusCode).json(body);
}

export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        code: "NOT_FOUND",
    });
}
