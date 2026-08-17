// src/middleware/validate.middleware.ts
import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ZodError } from "zod";
import { type ZodType } from "zod";
import { AppError } from "../utils/AppError.js";

function formatZodError(err: ZodError): AppError {
    const message = err.issues[0]?.message ?? "Invalid request data";
    const meta = {
        issues: err.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
        })),
    };
    return AppError.badRequest(message, "VALIDATION_ERROR", meta);
}

export function validateBody(schema: ZodType) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            next(formatZodError(result.error));
            return;
        }
        req.body = result.data;
        next();
    };
}

export function validateParams(schema: ZodType) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            next(formatZodError(result.error));
            return;
        }
        req.params = result.data as ParamsDictionary;
        next();
    };
}

export function validateQuery(schema: ZodType) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            next(formatZodError(result.error));
            return;
        }
        req.query = result.data as Request["query"];
        next();
    };
}
