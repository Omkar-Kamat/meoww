// addToQueue(userId: string): Promise<void>
// removeFromQueue(userId: string): Promise<void>
// popOrEnqueue(userId: string): Promise<string | null>
// createRoomAtomic(userA: string, userB: string): Promise<string>
// getRoom(roomId: string): Promise<RoomRecord | null>
// deleteRoom(roomId: string): Promise<void>
// getPeerId(roomId: string, userId: string): Promise<string | null>
// setUserRoom(userId: string, roomId: string): Promise<void>
// getUserRoom(userId: string): Promise<string | null>
// clearUserRoom(userId: string): Promise<void>
// src/modules/matchmaking/matchmaking.store.ts
import { v4 as uuidv4 } from "uuid";
import type { RoomRecord } from "./matchmaking.types.js";
import redisClient from "../../config/redis.js";
import {
    POP_OR_ENQUEUE_SCRIPT,
    CREATE_ROOM_SCRIPT,
    CHECK_AND_LOCK_SCRIPT,
    RELEASE_LOCK_SCRIPT,
} from "./matchmaking.lua.js";

// Note on queue fairness:
// We use a Redis Set (O(1) add/remove/pop) for the matchmaking queue rather than a FIFO List
// or Sorted Set. This means `popOrEnqueue` selects an arbitrary waiting user, offering no
// strict guarantees on wait times (the longest-waiting user isn't guaranteed to be matched first).
// For a random-pairing app with high throughput and short wait times, this is an acceptable
// trade-off for the simplicity and performance of O(1) SADD/SPOP operations.
const QUEUE_KEY = "mm:queue";
const ROOM_TTL_SECONDS = 86400; // 24h

const roomKey = (id: string): string => `mm:room:${id}`;
const userRoomKey = (id: string): string => `mm:userroom:${id}`;

export async function addToQueue(userId: string): Promise<void> {
    await redisClient.sAdd(QUEUE_KEY, userId);
}

export async function removeFromQueue(userId: string): Promise<void> {
    await redisClient.sRem(QUEUE_KEY, userId);
}

export async function getRoom(roomId: string): Promise<RoomRecord | null> {
    const room = await redisClient.hGetAll(roomKey(roomId));
    if (!room.user1 || !room.user2) return null;
    return { user1: room.user1, user2: room.user2 };
}

export async function deleteRoom(roomId: string): Promise<void> {
    await redisClient.del(roomKey(roomId));
}

export async function getPeerId(roomId: string, userId: string): Promise<string | null> {
    const room = await getRoom(roomId);
    if (!room) return null;
    return room.user1 === userId ? room.user2 : room.user1;
}

export async function getUserRoom(userId: string): Promise<string | null> {
    const result = await redisClient.get(userRoomKey(userId));
    return result ?? null;
}

export async function clearUserRoom(userId: string): Promise<void> {
    await redisClient.del(userRoomKey(userId));
}

export async function popOrEnqueue(userId: string): Promise<string | null> {
    const result = await redisClient.eval(POP_OR_ENQUEUE_SCRIPT, {
        keys: [QUEUE_KEY],
        arguments: [userId],
    });
    return typeof result === "string" ? result : null;
}

export async function createRoomAtomic(userA: string, userB: string): Promise<string> {
    const roomId = uuidv4();

    await redisClient.eval(CREATE_ROOM_SCRIPT, {
        keys: [roomKey(roomId), userRoomKey(userA), userRoomKey(userB)],
        arguments: [userA, userB, roomId, String(ROOM_TTL_SECONDS)],
    });

    return roomId;
}

export async function checkAndLock(
    userId: string,
): Promise<{ status: "OK" | "MATCHED" | "LOCKED"; token?: string }> {
    const token = uuidv4();
    const result = await redisClient.eval(CHECK_AND_LOCK_SCRIPT, {
        keys: [userRoomKey(userId), `mm:lock:${userId}`],
        arguments: [token],
    });
    return {
        status: result as "OK" | "MATCHED" | "LOCKED",
        ...(result === "OK" ? { token } : {}),
    };
}

export async function releaseLock(userId: string, token: string): Promise<void> {
    await redisClient.eval(RELEASE_LOCK_SCRIPT, {
        keys: [`mm:lock:${userId}`],
        arguments: [token],
    });
}
