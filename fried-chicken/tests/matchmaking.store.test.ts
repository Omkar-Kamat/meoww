import { vi, describe, it, expect, afterAll, beforeEach } from "vitest";
import Redis from "ioredis-mock";

const mockClient = new Redis();

vi.mock("../src/config/redis.js", () => {
    return {
        default: {
            eval: async (
                script: string,
                options: { keys?: string[]; arguments?: string[] } = {},
            ) => {
                const keys = options.keys ?? [];
                const args = options.arguments ?? [];
                return mockClient.eval(script, keys.length, ...keys, ...args);
            },
            sAdd: async (key: string, val: string) => mockClient.sadd(key, val),
            sRem: async (key: string, val: string) => mockClient.srem(key, val),
            sMembers: async (key: string) => mockClient.smembers(key),
            get: async (key: string) => mockClient.get(key),
            del: async (key: string) => mockClient.del(key),
            hGetAll: async (key: string) => mockClient.hgetall(key),
        },
    };
});

import * as store from "../src/modules/matchmaking/matchmaking.store.js";

describe("Matchmaking Lua Scripts Integration (via ioredis-mock)", () => {
    beforeEach(async () => {
        await mockClient.flushall();
    });

    afterAll(() => {
        mockClient.disconnect();
    });

    it("popOrEnqueue should add to queue if empty", async () => {
        const partner = await store.popOrEnqueue("userA");
        expect(partner).toBeNull();

        const queueMembers = await mockClient.smembers("mm:queue");
        expect(queueMembers).toEqual(["userA"]);
    });

    it("popOrEnqueue should return partner and remove from queue if not empty", async () => {
        await mockClient.sadd("mm:queue", "userB");
        const partner = await store.popOrEnqueue("userA");
        expect(partner).toBe("userB");

        const queueMembers = await mockClient.smembers("mm:queue");
        expect(queueMembers).toEqual([]);
    });

    it("popOrEnqueue should never match a user against themselves", async () => {
        await mockClient.sadd("mm:queue", "userA");
        const partner = await store.popOrEnqueue("userA");
        expect(partner).toBeNull();
    });

    it("createRoomAtomic should create room and set user references", async () => {
        const roomId = await store.createRoomAtomic("userA", "userB");
        expect(roomId).toBeDefined();

        const room = await mockClient.hgetall(`mm:room:${roomId}`);
        expect(room).toEqual({ user1: "userA", user2: "userB" });

        const userARoom = await mockClient.get(`mm:userroom:userA`);
        const userBRoom = await mockClient.get(`mm:userroom:userB`);
        expect(userARoom).toBe(roomId);
        expect(userBRoom).toBe(roomId);
    });

    it("checkAndLock should return OK and set lock if not matched", async () => {
        const { status, token } = await store.checkAndLock("userA");
        expect(status).toBe("OK");
        expect(token).toBeDefined();

        const lock = await mockClient.get(`mm:lock:userA`);
        expect(lock).toBe(token);
    });

    it("checkAndLock should return MATCHED if user is already in a room", async () => {
        await mockClient.set(`mm:userroom:userA`, "room123");

        const { status } = await store.checkAndLock("userA");
        expect(status).toBe("MATCHED");
    });

    it("checkAndLock should return LOCKED if user is already searching", async () => {
        await mockClient.set(`mm:lock:userA`, "1");

        const { status } = await store.checkAndLock("userA");
        expect(status).toBe("LOCKED");
    });

    it("releaseLock should only delete the lock if the token matches", async () => {
        const { status, token } = await store.checkAndLock("userA");
        expect(status).toBe("OK");

        await store.releaseLock("userA", "wrong-token");
        let lock = await mockClient.get(`mm:lock:userA`);
        expect(lock).toBe(token);
        if (!token) throw new Error("Expected token to be defined");
        await store.releaseLock("userA", token);
        lock = await mockClient.get(`mm:lock:userA`);
        expect(lock).toBeNull();
    });
});
