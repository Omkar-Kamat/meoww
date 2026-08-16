// addToQueue(userId: string): Promise<void>
// removeFromQueue(userId: string): Promise<void>
// popFromQueue(): Promise<string | null>
// createRoom(userA: string, userB: string): Promise<string>
// getRoom(roomId: string): Promise<{ user1: string; user2: string } | null>
// deleteRoom(roomId: string): Promise<void>
// getPeerId(roomId: string, userId: string): Promise<string | null>
// setUserRoom(userId: string, roomId: string): Promise<void>
// getUserRoom(userId: string): Promise<string | null>
// clearUserRoom(userId: string): Promise<void>
// setUserSocket(userId: string, socketId: string): Promise<void>
// getUserSocket(userId: string): Promise<string | null>
// clearUserSocket(userId: string): Promise<void>

// src/modules/matchmaking/matchmaking.store.ts
import { v4 as uuidv4 } from "uuid";
import type { RoomRecord } from "./matchmaking.types.js";
import redisClient from "../../config/redis.js";
import { POP_OR_ENQUEUE_SCRIPT, CREATE_ROOM_SCRIPT } from "./matchmaking.lua.js";


const QUEUE_KEY = "mm:queue";
const ROOM_TTL_SECONDS = 86400; // 24h

const roomKey = (id: string): string => `mm:room:${id}`;
const userRoomKey = (id: string): string => `mm:userroom:${id}`;
const userSocketKey = (id: string): string => `mm:usersocket:${id}`;

export async function addToQueue(userId: string): Promise<void> {
    await redisClient.sAdd(QUEUE_KEY, userId);
}

export async function removeFromQueue(userId: string): Promise<void> {
    await redisClient.sRem(QUEUE_KEY, userId);
}

export async function popFromQueue(): Promise<string | null> {
    const result = await redisClient.sPop(QUEUE_KEY);
    return result ?? null;
}

export async function createRoom(userA: string, userB: string): Promise<string> {
    const roomId = uuidv4();

    await Promise.all([
        redisClient.hSet(roomKey(roomId), { user1: userA, user2: userB }),
        redisClient.expire(roomKey(roomId), ROOM_TTL_SECONDS),
    ]);

    return roomId;
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

export async function setUserRoom(userId: string, roomId: string): Promise<void> {
    await redisClient.set(userRoomKey(userId), roomId);
    await redisClient.expire(userRoomKey(userId), ROOM_TTL_SECONDS);
}

export async function getUserRoom(userId: string): Promise<string | null> {
    const result = await redisClient.get(userRoomKey(userId));
    return result ?? null;
}

export async function clearUserRoom(userId: string): Promise<void> {
    await redisClient.del(userRoomKey(userId));
}

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