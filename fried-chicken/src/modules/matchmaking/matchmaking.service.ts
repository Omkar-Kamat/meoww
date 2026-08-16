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

let io: Server | undefined;

export function init(ioInstance: Server): void {
    io = ioInstance;
}

function getIo(): Server {
    if (!io) {
        throw new Error("Matchmaking service used before init() was called");
    }
    return io;
}

export async function tryMatch(userId: string): Promise<MatchResult | null> {
    const partnerId = await store.popFromQueue();

    if (!partnerId || partnerId === userId) {
        if (partnerId) {
            await store.addToQueue(partnerId);
        }
        await store.addToQueue(userId);
        return null;
    }

    const partnerSocketId = await store.getUserSocket(partnerId);
    if (!partnerSocketId) {
        return tryMatch(userId);
    }

    const liveSockets = await getIo().in(partnerSocketId).fetchSockets();
    if (liveSockets.length === 0) {
        await store.clearUserSocket(partnerId);
        return tryMatch(userId);
    }

    const roomId = await store.createRoom(userId, partnerId);
    const isInitiator = Math.random() > 0.5;

    await Promise.all([store.setUserRoom(userId, roomId), store.setUserRoom(partnerId, roomId)]);

    getIo().to(partnerSocketId).emit("matched", { roomId, isInitiator: !isInitiator });

    return { roomId, isInitiator, peerSocketId: partnerSocketId };
}

export async function handleSearch(socket: AuthedSocket): Promise<void> {
    const { userId } = socket;

    await store.setUserSocket(userId, socket.id);

    const [existingRoom] = await Promise.all([store.getUserRoom(userId)]);
    if (existingRoom) return;

    const match = await tryMatch(userId);

    if (!match) {
        getIo().to(socket.id).emit("queued", {});
        return;
    }

    getIo().to(socket.id).emit("matched", {
        roomId: match.roomId,
        isInitiator: match.isInitiator,
    });
}

export async function handleCancelSearch(userId: string): Promise<void> {
    await store.removeFromQueue(userId);
}

export async function handleLeaveRoom(userId: string): Promise<void> {
    const roomId = await store.getUserRoom(userId);
    if (!roomId) return;

    const peerId = await store.getPeerId(roomId, userId);

    if (peerId) {
        const peerSocketId = await store.getUserSocket(peerId);
        if (peerSocketId) {
            getIo().to(peerSocketId).emit("peer-disconnected");
        }
        await store.clearUserRoom(peerId);
    }

    await store.deleteRoom(roomId);
    await store.clearUserRoom(userId);
}

export async function fullCleanup(userId: string): Promise<void> {
    await store.removeFromQueue(userId);
    await handleLeaveRoom(userId);
    await store.clearUserSocket(userId);
}

export async function handleDisconnect(userId: string): Promise<void> {
    await fullCleanup(userId);
    log.info({ userId }, "User disconnected, cleanup complete");
}
