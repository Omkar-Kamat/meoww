import 'dotenv/config';
import "./src/config/env.js";
import redisClient from "./src/config/redis.js";

await redisClient.set("test:ping", "pong", { EX: 10 });
const val = await redisClient.get("test:ping");
console.log("Redis test result:", val); // should print: pong

await redisClient.quit();