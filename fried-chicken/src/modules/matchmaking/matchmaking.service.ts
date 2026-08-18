// handleSearch(socket: AuthedSocket): Promise<void>
// handleCancelSearch(userId: string): Promise<void>
// handleLeaveRoom(userId: string): Promise<void>
// handleDisconnect(userId: string): Promise<void>
// tryMatch(userId: string): Promise<MatchResult | null>
// fullCleanup(userId: string): Promise<void>

// src/modules/matchmaking/matchmaking.service.ts
import * as store from "./matchmaking.store.js";
import * as sessionStore from "../../realtime/session.store.js";
import { createModuleLogger } from "../../utils/logger.js";
import type { AuthedSocket, MatchResult } from "./matchmaking.types.js";
import type { EmitAction } from "../../realtime/socket.types.js";
import { BlockModel } from "../trust-safety/trust-safety.model.js";

const log = createModuleLogger("matchmaking");

export interface MatchmakingService {
    tryMatch(userId: string): Promise<{ match: MatchResult | null; actions: EmitAction[] }>;
    handleSearch(socket: AuthedSocket): Promise<EmitAction[]>;
    handleCancelSearch(userId: string): Promise<EmitAction[]>;
    handleLeaveRoom(userId: string): Promise<EmitAction[]>;
    fullCleanup(userId: string): Promise<EmitAction[]>;
    handleDisconnect(userId: string): Promise<EmitAction[]>;
}

export function createMatchmakingService(
    checkSocketLive: (socketId: string) => Promise<boolean>,
): MatchmakingService {
    const MAX_MATCH_ATTEMPTS = 5;

    async function tryMatch(
        userId: string,
    ): Promise<{ match: MatchResult | null; actions: EmitAction[] }> {
        const actions: EmitAction[] = [];
        for (let attempt = 0; attempt < MAX_MATCH_ATTEMPTS; attempt++) {
            const partnerId = await store.popOrEnqueue(userId);

            if (!partnerId) {
                return { match: null, actions };
            }

            const isBlocked = await BlockModel.exists({
                $or: [
                    { blockerId: userId, blockedId: partnerId },
                    { blockerId: partnerId, blockedId: userId },
                ],
            });

            if (isBlocked) {
                await store.addToQueue(partnerId);
                continue;
            }

            const partnerSocketId = await sessionStore.getUserSocket(partnerId);
            if (!partnerSocketId) {
                continue;
            }

            const isLive = await checkSocketLive(partnerSocketId);
            if (!isLive) {
                await sessionStore.clearUserSocket(partnerId);
                continue;
            }

            const roomId = await store.createRoomAtomic(userId, partnerId);
            const isInitiator = Math.random() > 0.5;

            actions.push({
                target: partnerSocketId,
                event: "matched",
                payload: { roomId, isInitiator: !isInitiator, peerId: userId },
            });

            return {
                match: { roomId, isInitiator, peerSocketId: partnerSocketId, peerId: partnerId },
                actions,
            };
        }

        await store.addToQueue(userId);
        log.warn({ userId, attempts: MAX_MATCH_ATTEMPTS }, "tryMatch exhausted retries, queued");
        return { match: null, actions: [] };
    }

    async function handleSearch(socket: AuthedSocket): Promise<EmitAction[]> {
        const { userId } = socket;

        const { status, token } = await store.checkAndLock(userId);
        if (status === "MATCHED" || status === "LOCKED") {
            return [];
        }

        try {
            const { match, actions } = await tryMatch(userId);

            if (!match) {
                actions.push({ target: socket.id, event: "queued", payload: {} });
                return actions;
            }

            actions.push({
                target: socket.id,
                event: "matched",
                payload: {
                    roomId: match.roomId,
                    isInitiator: match.isInitiator,
                    peerId: match.peerId,
                },
            });

            return actions;
        } finally {
            if (token) {
                await store.releaseLock(userId, token);
            }
        }
    }

    async function handleCancelSearch(userId: string): Promise<EmitAction[]> {
        await store.removeFromQueue(userId);
        return [];
    }

    async function handleLeaveRoom(userId: string): Promise<EmitAction[]> {
        const actions: EmitAction[] = [];
        const roomId = await store.getUserRoom(userId);
        if (!roomId) return actions;

        const peerId = await store.getPeerId(roomId, userId);

        if (peerId) {
            const peerSocketId = await sessionStore.getUserSocket(peerId);
            if (peerSocketId) {
                actions.push({
                    target: peerSocketId,
                    event: "peer-disconnected",
                    payload: undefined,
                });
            }
            await store.clearUserRoom(peerId);
        }

        await store.deleteRoom(roomId);
        await store.clearUserRoom(userId);
        return actions;
    }

    async function fullCleanup(userId: string): Promise<EmitAction[]> {
        await store.removeFromQueue(userId);
        const actions = await handleLeaveRoom(userId);
        await sessionStore.clearUserSocket(userId);
        return actions;
    }

    async function handleDisconnect(userId: string): Promise<EmitAction[]> {
        const actions = await fullCleanup(userId);
        log.info({ userId }, "User disconnected, cleanup complete");
        return actions;
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
