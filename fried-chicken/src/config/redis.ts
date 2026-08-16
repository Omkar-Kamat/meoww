// createRedisClient(): RedisClientType — instantiates and connects the Redis client
// redisClient — exported singleton instance

// src/config/redis
import { createClient, type RedisClientType } from "redis";
import { createModuleLogger, logError } from "../utils/logger.js";

const log = createModuleLogger("redis");

function createRedisClient(): RedisClientType {
    const host = process.env.REDIS_HOST;
    const port = process.env.REDIS_PORT;
    const password = process.env.REDIS_PASSWORD;

    if (!host || !port) {
        throw new Error("REDIS_HOST and REDIS_PORT environment variables are required");
    }

    const client: RedisClientType = createClient({
        username: "default",
        ...(password && { password }),
        socket: {
            host,
            port: Number(port),
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

export { createRedisClient, redisClient };
export default redisClient;
