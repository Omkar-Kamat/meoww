// bootstrap() — connects DB/Redis, creates HTTP server from Express app, initializes Socket.io, starts listening
// handleShutdown(signal: string) — graceful shutdown on SIGTERM/SIGINT (close server, close DB/Redis connections)

// src/index.ts
import "dotenv/config";
import "./config/env.js";

import http from "http";
import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { createSocketServer, mountGateways } from "./realtime/socket.server.js";
import redisClient, { disconnectRedis } from "./config/redis.js";
import { env } from "./config/env.js";
import { createModuleLogger, logError } from "./utils/logger.js";

const log = createModuleLogger("bootstrap");
const PORT = env.PORT;
const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = createApp();
const server = http.createServer(app);

async function bootstrap(): Promise<void> {
    await connectDB();
    await redisClient.connect();

    const io = await createSocketServer(server);
    mountGateways(io);

    server.listen(PORT, () => {
        log.info(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });
}

function handleShutdown(signal: string): void {
    log.info(`${signal} received — shutting down gracefully`);

    server.close(() => {
        void (async () => {
            log.info("HTTP server closed");

            try {
                await disconnectDB();
            } catch (err) {
                logError(err, { context: "shutdown-mongodb" });
            }

            try {
                await disconnectRedis();
            } catch (err) {
                logError(err, { context: "shutdown-redis" });
            }

            log.info("Clean exit");
            process.exit(0);
        })();
    });

    setTimeout(() => {
        log.error("Shutdown timeout reached — forcing exit");
        process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
}

process.on("SIGTERM", () => {
    handleShutdown("SIGTERM");
});
process.on("SIGINT", () => {
    handleShutdown("SIGINT");
});

bootstrap().catch((err: unknown) => {
    logError(err, { context: "bootstrap-failed" });
    process.exit(1);
});