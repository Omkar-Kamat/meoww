import express, { type Application, type Request, type Response } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import compression from "compression";
import mongoose from "mongoose";
const { ConnectionStates } = mongoose;
import swaggerUi from "swagger-ui-express";
import corsOptions, { allowedOrigins } from "./config/cors.js";
import swaggerSpec from "./config/swagger.js";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import otpRoutes from "./modules/otp/otp.routes.js";
import webrtcRoutes from "./modules/webrtc/webrtc.routes.js";
import trustSafetyRoutes from "./modules/trust-safety/trust-safety.routes.js";
import { httpLogger, createModuleLogger } from "./utils/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { env } from "./config/env.js";

const log = createModuleLogger("app");
const isProd = env.NODE_ENV === "production";
const isTest = env.NODE_ENV === "test";

export function createApp(): Application {
    const app = express();

    if (isProd) {
        app.set("trust proxy", 1);
    }

    app.use(httpLogger);

    if (isProd) {
        morgan.token("body-size", (_req, res) => String(res.getHeader("content-length") ?? "-"));
        app.use(
            morgan((tokens, req, res) => {
                return JSON.stringify({
                    ts: tokens.date?.(req, res, "iso"),
                    method: tokens.method?.(req, res),
                    url: tokens.url?.(req, res),
                    status: Number(tokens.status?.(req, res)),
                    ms: Number(tokens["response-time"]?.(req, res)),
                    bytes: tokens.res?.(req, res, "content-length") ?? 0,
                    ip: tokens["remote-addr"]?.(req, res),
                });
            }),
        );
    } else if (!isTest) {
        app.use(morgan("dev"));
    }

    if (!isProd) {
        app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
        log.info("Swagger docs available at /api-docs");
    }

    app.use(compression());

    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    connectSrc: [
                        "'self'",
                        ...allowedOrigins,
                        `stun:${env.TURN_DOMAIN}:${env.TURN_PORT}`,
                        `turn:${env.TURN_DOMAIN}:${env.TURN_PORT}`,
                        `turns:${env.TURN_DOMAIN}:${env.TURN_TLS_PORT}`,
                    ],
                    mediaSrc: ["'self'", "blob:"],
                    imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                },
            },
            hsts: isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
        }),
    );

    app.use(cors(corsOptions));
    app.use(cookieParser());

    app.use(express.json({ limit: "16kb" }));
    app.use(express.urlencoded({ extended: true, limit: "16kb" }));

    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/otp", otpRoutes);
    app.use("/api/webrtc", webrtcRoutes);
    app.use("/api/trust-safety", trustSafetyRoutes);

    registerHealthRoutes(app);

    app.use(notFoundHandler);
    registerErrorHandler(app);

    return app;
}

export function registerHealthRoutes(app: Application): void {
    app.get("/health", (_req: Request, res: Response) => {
        res.json({ status: "ok" });
    });

    app.get("/health/deep", (_req: Request, res: Response) => {
        const isDbHealthy = mongoose.connection.readyState === ConnectionStates.connected;
        if (!isDbHealthy) {
            res.status(503).json({
                status: "error",
                db: "disconnected",
                dbState: mongoose.connection.readyState,
            });
            return;
        }
        res.json({ status: "ok", db: "connected" });
    });
}

export function registerErrorHandler(app: Application): void {
    app.use(errorHandler);
}
