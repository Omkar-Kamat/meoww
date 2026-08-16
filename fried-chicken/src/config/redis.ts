// createRedisClient(): RedisClientType — instantiates the Redis client (call
//   redisClient.connect() separately at boot — see index.ts)
// redisClient — exported singleton instance
// disconnectRedis(): Promise<void> — used in graceful shutdown

// src/config/redis
import { createClient, type RedisClientType } from "redis";
import { createModuleLogger, logError } from "../utils/logger.js";
import { env } from "./env.js";

const log = createModuleLogger("redis");

function createRedisClient(): RedisClientType {
    const host = env.REDIS_HOST;
    const port = env.REDIS_PORT;
    const password = env.REDIS_PASSWORD;

    const client: RedisClientType = createClient({
        username: "default",
        ...(password && { password }),
        socket: {
            host,
            port,
            reconnectStrategy: (retries) => {
                if (retries > 10) {
                    log.error({ retries }, "Too many reconnection attempts. Giving up.");
                    return new Error("Redis reconnection limit reached");
                }
                return Math.min(100 * 2 ** retries, 3000);
            },
        },
    });

    client.on("error", (err: Error) => {
        logError(err, { context: "redis-client-error" });
    });
    client.on("connect", () => {
        log.info("Connected");
    });
    client.on("reconnecting", () => {
        log.warn("Reconnecting...");
    });
    client.on("ready", () => {
        log.info("Ready");
    });

    return client;
}

const redisClient: RedisClientType = createRedisClient();

async function disconnectRedis(): Promise<void> {
    if (!redisClient.isOpen) {
        // already disconnected — nothing to do
        return;
    }

    try {
        await redisClient.quit();
        log.info("Disconnected cleanly");
    } catch (err) {
        logError(err, { context: "redis-disconnect" });
        throw err;
    }
}

export { createRedisClient, redisClient, disconnectRedis };
export default redisClient;