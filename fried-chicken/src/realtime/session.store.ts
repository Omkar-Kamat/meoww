import redisClient from "../config/redis.js";

const userSocketKey = (id: string): string => `rt:usersocket:${id}`;

export async function setUserSocket(userId: string, socketId: string): Promise<void> {
    await redisClient.set(userSocketKey(userId), socketId);
}

export async function getUserSocket(userId: string): Promise<string | null> {
    const result = await redisClient.get(userSocketKey(userId));
    return result ?? null;
}

export async function clearUserSocket(userId: string): Promise<void> {
    await redisClient.del(userSocketKey(userId));
}
