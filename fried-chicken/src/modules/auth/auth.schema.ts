// signupSchema — Zod schema
// loginSchema
// forgotPasswordSchema
// resetPasswordSchema

// src/modules/auth/auth.schema
import { z } from "zod";

export const signupSchema = z.object({
    name: z.string().min(2).max(50),
    username: z
        .string()
        .min(3)
        .max(20)
        .regex(
            /^[a-z0-9_]+$/,
            "Username can only contain lowercase letters, numbers and underscores",
        )
        .transform((val) => val.trim().toLowerCase())
        .refine((val) => !["admin", "meoww", "support", "test"].includes(val), {
            message: "This username is not allowed",
        }),
    email: z.email(),
    password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
});

export const forgotPasswordSchema = z.object({
    email: z.email("Please provide a valid email address"),
});

export const resetPasswordSchema = z.object({
    userId: z.string().length(24).regex(/^[0-9a-f]+$/),
    token: z
        .string()
        .length(64, "Invalid reset token")
        .regex(/^[a-f0-9]+$/, "Invalid reset token"),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .max(100, "Password is too long"),
});
