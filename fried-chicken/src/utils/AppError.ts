// class AppError extends Error — constructor (message: string, statusCode: number, code?: string, meta?: Record<string, unknown>)

// src/utils/AppError
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string | undefined;
    public readonly meta: Record<string, unknown>;
    public readonly isOperational: boolean;

    constructor(
        message: string,
        statusCode = 400,
        code?: string,
        meta: Record<string, unknown> = {},
    ) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
        this.meta = meta;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(
        message: string,
        code?: string,
        meta: Record<string, unknown> = {},
    ): AppError {
        return new AppError(message, 400, code, meta);
    }

    static unauthorized(
        message: string,
        code?: string,
        meta: Record<string, unknown> = {},
    ): AppError {
        return new AppError(message, 401, code, meta);
    }

    static forbidden(message: string, code?: string, meta: Record<string, unknown> = {}): AppError {
        return new AppError(message, 403, code, meta);
    }

    static notFound(message: string, code?: string, meta: Record<string, unknown> = {}): AppError {
        return new AppError(message, 404, code, meta);
    }

    static conflict(message: string, code?: string, meta: Record<string, unknown> = {}): AppError {
        return new AppError(message, 409, code, meta);
    }

    static internal(message: string, code?: string, meta: Record<string, unknown> = {}): AppError {
        return new AppError(message, 500, code, meta);
    }
}
