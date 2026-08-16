// handleSearch(socket: AuthedSocket): Promise<void>
// handleCancelSearch(userId: string): Promise<void>
// handleLeaveRoom(userId: string): Promise<void>
// handleDisconnect(userId: string): Promise<void>
// tryMatch(userId: string): Promise<MatchResult | null>
// fullCleanup(userId: string): Promise<void>

// src/modules/matchmaking/matchmaking.service.ts
import * as store from "./matchmaking.store.js";
import { createModuleLogger } from "../../utils/logger.js";
import type { AuthedSocket, MatchResult } from "./matchmaking.types.js";
import type { Server } from "socket.io";

const log = createModuleLogger("matchmaking");

export interface MatchmakingService {
    tryMatch(userId: string): Promise<MatchResult | null>;
    handleSearch(socket: AuthedSocket): Promise<void>;
    handleCancelSearch(userId: string): Promise<void>;
    handleLeaveRoom(userId: string): Promise<void>;
    fullCleanup(userId: string): Promise<void>;
    handleDisconnect(userId: string): Promise<void>;
}

export function createMatchmakingService(io: Server): MatchmakingService {
    const MAX_MATCH_ATTEMPTS = 5;

    async function tryMatch(userId: string): Promise<MatchResult | null> {
        for (let attempt = 0; attempt < MAX_MATCH_ATTEMPTS; attempt++) {
            const partnerId = await store.popOrEnqueue(userId);

            if (!partnerId) {
                return null;
            }

            const partnerSocketId = await store.getUserSocket(partnerId);
            if (!partnerSocketId) {
                continue;
            }

            const liveSockets = await io.in(partnerSocketId).fetchSockets();
            if (liveSockets.length === 0) {
                await store.clearUserSocket(partnerId);
                continue;
            }

            const roomId = await store.createRoomAtomic(userId, partnerId);
            const isInitiator = Math.random() > 0.5;

            io.to(partnerSocketId).emit("matched", { roomId, isInitiator: !isInitiator });

            return { roomId, isInitiator, peerSocketId: partnerSocketId };
        }

        await store.addToQueue(userId);
        log.warn({ userId, attempts: MAX_MATCH_ATTEMPTS }, "tryMatch exhausted retries, queued");
        return null;
    }

    async function handleSearch(socket: AuthedSocket): Promise<void> {
        const { userId } = socket;

        await store.setUserSocket(userId, socket.id);

        const [existingRoom] = await Promise.all([store.getUserRoom(userId)]);
        if (existingRoom) return;

        const match = await tryMatch(userId);

        if (!match) {
            io.to(socket.id).emit("queued", {});
            return;
        }

        io.to(socket.id).emit("matched", {
            roomId: match.roomId,
            isInitiator: match.isInitiator,
        });
    }

    async function handleCancelSearch(userId: string): Promise<void> {
        await store.removeFromQueue(userId);
    }

    async function handleLeaveRoom(userId: string): Promise<void> {
        const roomId = await store.getUserRoom(userId);
        if (!roomId) return;

        const peerId = await store.getPeerId(roomId, userId);

        if (peerId) {
            const peerSocketId = await store.getUserSocket(peerId);
            if (peerSocketId) {
                io.to(peerSocketId).emit("peer-disconnected");
            }
            await store.clearUserRoom(peerId);
        }

        await store.deleteRoom(roomId);
        await store.clearUserRoom(userId);
    }

    async function fullCleanup(userId: string): Promise<void> {
        await store.removeFromQueue(userId);
        await handleLeaveRoom(userId);
        await store.clearUserSocket(userId);
    }

    async function handleDisconnect(userId: string): Promise<void> {
        await fullCleanup(userId);
        log.info({ userId }, "User disconnected, cleanup complete");
    }

    return {
        tryMatch,
        handleSearch,
        handleCancelSearch,
        handleLeaveRoom,
        fullCleanup,
        handleDisconnect,
    };
}
