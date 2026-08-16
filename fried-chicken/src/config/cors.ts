// corsOptions — exported CORS config object
// allowedOrigins — exported array/list used by both CORS and CSP headers

// src/config/cors
import type { CorsOptions } from "cors";
import { createModuleLogger } from "../utils/logger.js";

const log = createModuleLogger("CORS");

const rawOrigins = process.env.ALLOWED_ORIGINS ?? "";
if (!rawOrigins) {
    throw new Error("ALLOWED_ORIGINS environment variable is required");
}

export const allowedOrigins: string[] = rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin): origin is string => Boolean(origin));

log.info({ allowedOrigins }, "Allowed origins loaded");

const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            log.warn({ origin }, "Blocked by CORS");
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
};

export default corsOptions;
