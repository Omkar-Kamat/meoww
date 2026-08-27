import redisClient from "../config/redis.js";

const userSocketKey = (id: string): string => `rt:usersocket:${id}`;

// Bounds how long a user->socket mapping can survive if the owning process
// crashes or is killed before the socket's "disconnect" handler runs (which
// is what normally clears this key). Without a TTL a crash could leave a
// stale mapping pointing at a dead socket indefinitely; matchmaking already
// verifies liveness before using this mapping, so this is a belt-and-braces
// bound, not a correctness fix on its own. Comfortably longer than any
// realistic client session so it never expires under normal use.
const USER_SOCKET_TTL_SECONDS = 12 * 60 * 60;

export async function setUserSocket(userId: string, socketId: string): Promise<void> {
    await redisClient.set(userSocketKey(userId), socketId, { EX: USER_SOCKET_TTL_SECONDS });
}

export async function getUserSocket(userId: string): Promise<string | null> {
    const result = await redisClient.get(userSocketKey(userId));
    return result ?? null;
}

export async function clearUserSocket(userId: string): Promise<void> {
    await redisClient.del(userSocketKey(userId));
}
