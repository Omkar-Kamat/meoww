import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { createMatchmakingService } from "../src/modules/matchmaking/matchmaking.service.js";
import * as store from "../src/modules/matchmaking/matchmaking.store.js";
import * as sessionStore from "../src/realtime/session.store.js";

vi.mock("../src/modules/matchmaking/matchmaking.store.js", () => ({
    popOrEnqueue: vi.fn(),
    createRoomAtomic: vi.fn(),
    addToQueue: vi.fn(),
    getUserRoom: vi.fn(),
    removeFromQueue: vi.fn(),
    getPeerId: vi.fn(),
    clearUserRoom: vi.fn(),
    deleteRoom: vi.fn(),
}));

vi.mock("../src/realtime/session.store.js", () => ({
    getUserSocket: vi.fn(),
    clearUserSocket: vi.fn(),
}));

describe("MatchmakingService", () => {
    let checkSocketLive: Mock<(socketId: string) => Promise<boolean>>;
    let service: ReturnType<typeof createMatchmakingService>;

    beforeEach(() => {
        vi.clearAllMocks();
        checkSocketLive = vi.fn().mockResolvedValue(true);
        service = createMatchmakingService(checkSocketLive);
    });

    describe("tryMatch", () => {
        it("should return no match and empty actions if popOrEnqueue returns null (queue was empty)", async () => {
            vi.mocked(store.popOrEnqueue).mockResolvedValue(null);

            const result = await service.tryMatch("userA");

            expect(result.match).toBeNull();
            expect(result.actions).toEqual([]);
            expect(store.popOrEnqueue).toHaveBeenCalledWith("userA");
            expect(sessionStore.getUserSocket).not.toHaveBeenCalled();
        });

        it("should create a room and return match if partner is found and live", async () => {
            vi.mocked(store.popOrEnqueue).mockResolvedValue("userB");
            vi.mocked(sessionStore.getUserSocket).mockResolvedValue("socketB");
            vi.mocked(store.createRoomAtomic).mockResolvedValue("room123");

            const result = await service.tryMatch("userA");

            expect(result.match).not.toBeNull();
            expect(result.match?.roomId).toBe("room123");
            expect(result.match?.peerSocketId).toBe("socketB");

            expect(result.actions).toHaveLength(1);
            expect(result.actions[0]?.target).toBe("socketB");
            expect(result.actions[0]?.event).toBe("matched");
            expect(result.actions[0]?.payload).toHaveProperty("roomId", "room123");
        });

        it("should skip partner and retry if partner has no socket in session store", async () => {
            vi.mocked(store.popOrEnqueue)
                .mockResolvedValueOnce("userB")
                .mockResolvedValueOnce("userC");

            vi.mocked(sessionStore.getUserSocket).mockImplementation((userId) => {
                if (userId === "userB") return Promise.resolve(null);
                if (userId === "userC") return Promise.resolve("socketC");
                return Promise.resolve(null);
            });
            vi.mocked(store.createRoomAtomic).mockResolvedValue("room123");

            const result = await service.tryMatch("userA");

            expect(result.match).not.toBeNull();
            expect(result.match?.roomId).toBe("room123");
            expect(result.match?.peerSocketId).toBe("socketC");
            expect(store.popOrEnqueue).toHaveBeenCalledTimes(2);
        });

        it("should skip partner, clear socket, and retry if partner socket is dead", async () => {
            vi.mocked(store.popOrEnqueue)
                .mockResolvedValueOnce("userB")
                .mockResolvedValueOnce("userC");

            vi.mocked(sessionStore.getUserSocket).mockImplementation((userId) => {
                if (userId === "userB") return Promise.resolve("socketB");
                if (userId === "userC") return Promise.resolve("socketC");
                return Promise.resolve(null);
            });

            checkSocketLive.mockImplementation((socketId) => {
                if (socketId === "socketB") return Promise.resolve(false);
                if (socketId === "socketC") return Promise.resolve(true);
                return Promise.resolve(false);
            });

            vi.mocked(store.createRoomAtomic).mockResolvedValue("room123");

            const result = await service.tryMatch("userA");

            expect(sessionStore.clearUserSocket).toHaveBeenCalledWith("userB");
            expect(result.match).not.toBeNull();
            expect(result.match?.peerSocketId).toBe("socketC");
            expect(store.popOrEnqueue).toHaveBeenCalledTimes(2);
        });

        it("should queue and return no match if retries are exhausted", async () => {
            vi.mocked(store.popOrEnqueue).mockResolvedValue("deadUser");
            vi.mocked(sessionStore.getUserSocket).mockResolvedValue("deadSocket");
            checkSocketLive.mockResolvedValue(false); // all partners are dead

            const result = await service.tryMatch("userA");

            expect(store.popOrEnqueue).toHaveBeenCalledTimes(5);
            expect(store.addToQueue).toHaveBeenCalledWith("userA");
            expect(result.match).toBeNull();
            expect(result.actions).toEqual([]);
        });
    });
});
