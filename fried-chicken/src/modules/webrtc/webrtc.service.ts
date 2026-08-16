import type { Server } from "socket.io";
import * as matchmakingStore from "../matchmaking/matchmaking.store.js";
import type { AuthedSocket } from "./webrtc.types.js";

export interface WebrtcService {
    relayOffer(socket: AuthedSocket, offer: unknown): Promise<void>;
    relayAnswer(socket: AuthedSocket, answer: unknown): Promise<void>;
    relayIceCandidate(socket: AuthedSocket, candidate: unknown): Promise<void>;
    relayMessage(socket: AuthedSocket, text: string): Promise<void>;
}

export function createWebrtcService(io: Server): WebrtcService {
    async function getPeerSocketId(userId: string): Promise<string | null> {
        const roomId = await matchmakingStore.getUserRoom(userId);
        if (!roomId) return null;

        const peerId = await matchmakingStore.getPeerId(roomId, userId);
        if (!peerId) return null;

        return matchmakingStore.getUserSocket(peerId);
    }

    async function relayOffer(socket: AuthedSocket, offer: unknown): Promise<void> {
        const peerSocketId = await getPeerSocketId(socket.userId);
        if (peerSocketId) {
            io.to(peerSocketId).emit("offer", { offer });
        }
    }

    async function relayAnswer(socket: AuthedSocket, answer: unknown): Promise<void> {
        const peerSocketId = await getPeerSocketId(socket.userId);
        if (peerSocketId) {
            io.to(peerSocketId).emit("answer", { answer });
        }
    }

    async function relayIceCandidate(socket: AuthedSocket, candidate: unknown): Promise<void> {
        const peerSocketId = await getPeerSocketId(socket.userId);
        if (peerSocketId) {
            io.to(peerSocketId).emit("ice-candidate", { candidate });
        }
    }

    async function relayMessage(socket: AuthedSocket, text: string): Promise<void> {
        const trimmed = text.trim();
        if (trimmed.length === 0 || trimmed.length > 500) return;

        const peerSocketId = await getPeerSocketId(socket.userId);
        if (!peerSocketId) return;

        io.to(peerSocketId).emit("receive-message", { text: trimmed, fromSelf: false });
        io.to(socket.id).emit("receive-message", { text: trimmed, fromSelf: true });
    }

    return {
        relayOffer,
        relayAnswer,
        relayIceCandidate,
        relayMessage,
    };
}
