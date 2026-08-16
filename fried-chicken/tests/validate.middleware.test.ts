import { describe, it, expect, vi } from "vitest";
import { validateBody } from "../src/middleware/validate.middleware.js";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../src/utils/AppError.js";

describe("validateBody middleware", () => {
    it("strips unknown fields from req.body", () => {
        const schema = z.object({
            username: z.string(),
            password: z.string(),
        });

        const req = {
            body: {
                username: "testuser",
                password: "password123",
                admin: true, // This should be stripped
                userId: "12345", // This should be stripped
            },
        } as Request;

        const res = {} as Response;
        const next: NextFunction = vi.fn();

        const middleware = validateBody(schema);
        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(); // Called with no arguments (success)
        expect(req.body).toEqual({
            username: "testuser",
            password: "password123",
        });
        expect(req.body).not.toHaveProperty("admin");
        expect(req.body).not.toHaveProperty("userId");
    });

    it("calls next with AppError on validation failure", () => {
        const schema = z.object({
            username: z.string(),
        });

        const req = {
            body: {
                // missing username
            },
        } as Request;

        const res = {} as Response;
        const next: NextFunction = vi.fn();

        const middleware = validateBody(schema);
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        const err = (next as any).mock.calls[0][0];
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe("VALIDATION_ERROR");
    });
});
