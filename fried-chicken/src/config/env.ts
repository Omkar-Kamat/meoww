// loadEnv() — validates required env vars are present (ideally via Zod schema), throws on startup if missing
// env — exported typed config object (e.g. { PORT, MONGO_URI, REDIS_URL, JWT_SECRET, ... })

// src/config/env
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(5000),

    MONGO_URI: z.string().min(1, "MONGO_URI is required"),

    JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
    JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
    ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
    REFRESH_TOKEN_EXPIRY: z.string().default("7d"),

    BREVO_API_KEY: z.string().min(1, "BREVO_API_KEY is required"),
    EMAIL_FROM: z.email("EMAIL_FROM must be a valid email address"),

    CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
    CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
    CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),

    TURN_DOMAIN: z.string().min(1, "TURN_DOMAIN is required"),
    TURN_SECRET: z.string().min(32, "TURN_SECRET must be at least 32 characters"),
    TURN_PORT: z.coerce.number().int().positive().default(3478),
    TURN_TLS_PORT: z.coerce.number().int().positive().default(5349),

    FRONTEND_URL: z.url("FRONTEND_URL must be a valid URL").optional(),
    BASE_URL: z.url("BASE_URL must be a valid URL").optional(),

    CROSS_SITE: z
        .enum(["true", "false"])
        .default("false")
        .transform((val) => val === "true"),

    REDIS_HOST: z.string().min(1, "REDIS_HOST is required"),
    REDIS_PORT: z.coerce.number().int().positive(),
    REDIS_PASSWORD: z.string().min(1, "REDIS_PASSWORD is required"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        const errors = parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("\n");

        throw new Error(`Invalid environment variables:\n${errors}`);
    }

    return parsed.data;
}

export const env: Env = loadEnv();
