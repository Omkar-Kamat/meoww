import { createClient } from "redis";

const redisClient = createClient({
    username: "default",
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error("[Redis] Too many reconnection attempts. Giving up.");
                return new Error("Redis reconnection limit reached");
            }
            // Exponential backoff: 100ms, 200ms, 400ms … capped at 3s
            return Math.min(100 * 2 ** retries, 3000);
        },
    },
});

redisClient.on("error",        (err) => console.error("[Redis] Error:", err.message));
redisClient.on("connect",      ()    => console.log("[Redis] Connected"));
redisClient.on("reconnecting", ()    => console.warn("[Redis] Reconnecting..."));
redisClient.on("ready",        ()    => console.log("[Redis] Ready"));

await redisClient.connect();

export default redisClient;