import { describe, it, expect, vi, type Mock } from "vitest";
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
                admin: true,
                userId: "12345",
            },
        } as Request;

        const res = {} as Response;
        const next: NextFunction = vi.fn();

        const middleware = validateBody(schema);
        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
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
            body: {},
        } as Request;

        const res = {} as Response;
        const next: NextFunction = vi.fn();

        const middleware = validateBody(schema);
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        const err = (next as Mock).mock.calls[0][0] as AppError;
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe("VALIDATION_ERROR");
    });
});
