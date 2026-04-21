import { z } from "zod";

export const signupSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(50),
        username: z
            .string()
            .min(3)
            .max(20)
            .regex(
                /^[a-z0-9_]+$/,
                "Username can only contain lowercase letters, numbers and underscores"
            )
            .transform((val) => val.trim().toLowerCase())
            .refine(
                (val) => !["admin", "meoww", "support", "test"].includes(val),
                { message: "This username is not allowed" }
            ),
        email: z.email(),
        password: z.string().min(6).max(100),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.email(),
        password: z.string().min(6),
    }),
});

export const verifySchema = z.object({
    body: z.object({
        userId: z.string().length(24),
        otp: z.string().length(6),
    }),
});

export const resendOtpSchema = z.object({
    body: z.object({
        userId: z.string().length(24),
    }),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.email("Please provide a valid email address"),
    }),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        // MongoDB ObjectId — used to fetch the single reset record for this user
        userId: z.string().length(24, "Invalid reset link"),
        // 64-char hex string produced by crypto.randomBytes(32).toString("hex")
        token: z
            .string()
            .length(64, "Invalid reset token")
            .regex(/^[a-f0-9]+$/, "Invalid reset token"),
        password: z
            .string()
            .min(6, "Password must be at least 6 characters")
            .max(100, "Password is too long"),
    }),
});