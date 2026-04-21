import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import compression from "compression";
import corsOptions, { allowedOrigins } from "./config/cors.js";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import mongoose from "mongoose";
import { AppError } from "./utils/AppError.js";

const app = express();

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

if (process.env.NODE_ENV === "production") {
    morgan.token("body-size", (req, res) => res.getHeader("content-length") ?? "-");
    app.use(
        morgan((tokens, req, res) => {
            return JSON.stringify({
                ts:     tokens.date(req, res, "iso"),
                method: tokens.method(req, res),
                url:    tokens.url(req, res),
                status: Number(tokens.status(req, res)),
                ms:     Number(tokens["response-time"](req, res)),
                bytes:  tokens["res"](req, res, "content-length") ?? 0,
                ip:     tokens["remote-addr"](req, res),
            });
        })
    );
} else if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
}

// ─── Swagger (non-production only) ───────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log("📖 Swagger docs available at /api-docs");
}

// ─── Compression ──────────────────────────────────────────────────────────────
// Gzip all responses above 1kb. Placed before routes so every response
// is eligible. Skips already-compressed formats (images, video) automatically.
app.use(compression());

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                connectSrc: [
                    "'self'",
                    ...allowedOrigins,
                    `wss://${process.env.METERED_DOMAIN}`,
                    `https://${process.env.METERED_DOMAIN}`,
                ],
                mediaSrc:  ["'self'", "blob:"],
                imgSrc:    ["'self'", "data:", "https://res.cloudinary.com"],
                scriptSrc: ["'self'"],
                styleSrc:  ["'self'", "'unsafe-inline'"],
            },
        },
        hsts: process.env.NODE_ENV === "production"
            ? { maxAge: 31536000, includeSubDomains: true }
            : false,
    })
);

app.use(cors(corsOptions));
app.use(cookieParser());

// ─── Body limits ──────────────────────────────────────────────────────────────
// 16kb is generous for any JSON payload this app sends (auth, profile updates).
// Multer handles multipart/form-data (file uploads) separately with its own
// 5MB limit — these limits only apply to JSON and URL-encoded bodies.
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// ─── Health checks ────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.get("/health/deep", async (req, res) => {
    const isDbHealthy = mongoose.connection.readyState === 1;
    if (!isDbHealthy) {
        return res.status(503).json({
            status: "error",
            db: "disconnected",
            dbState: mongoose.connection.readyState,
        });
    }
    res.json({ status: "ok", db: "connected" });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err.name === "MulterError") {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File too large. Maximum size is 5MB." });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    }

    if (err.message === "Only image files allowed") {
        return res.status(400).json({
            error: "Only image files are allowed (jpg, jpeg, png, webp).",
        });
    }

    if (err instanceof AppError) {
        const body = { error: err.message };
        if (err.code) body.code = err.code;
        if (err.meta && Object.keys(err.meta).length > 0) {
            Object.assign(body, err.meta);
        }
        return res.status(err.statusCode).json(body);
    }

    if (process.env.NODE_ENV !== "production") {
        console.error("[Unhandled Error]", err);
    } else {
        console.error(`[Unhandled Error] ${err.message}`, {
            stack: err.stack,
            url: req.url,
            method: req.method,
        });
    }

    res.status(500).json({
        error: process.env.NODE_ENV === "production"
            ? "Internal Server Error"
            : err.message,
    });
});

export default app;