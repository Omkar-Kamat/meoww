// bootstrap() — connects DB/Redis, creates HTTP server from Express app, initializes Socket.io, starts listening
// handleShutdown(signal: string) — graceful shutdown on SIGTERM/SIGINT (close server, close DB/Redis connections)

// src/index.ts
import "dotenv/config";

try {
    await import("./config/env.js");
} catch (err) {
    // eslint-disable-next-line no-console
    console.error("\n❌ Invalid environment variables:\n");
    // eslint-disable-next-line no-console
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
}

const { default: http } = await import("http");
const { createApp } = await import("./app.js");
const { connectDB, disconnectDB } = await import("./config/db.js");
const { createSocketServer, mountGateways } = await import("./realtime/socket.server.js");
const { default: redisClient, disconnectRedis } = await import("./config/redis.js");
const { env } = await import("./config/env.js");
const { createModuleLogger, logError } = await import("./utils/logger.js");


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