import type { Server } from "socket.io";
import * as matchmakingStore from "../matchmaking/matchmaking.store.js";
import type { AuthedSocket } from "./webrtc.types.js";

let io: Server | undefined;

export function init(ioInstance: Server): void {
    io = ioInstance;
}

function getIo(): Server {
    if (!io) {
        throw new Error("WebRTC service used before init() was called");
    }
    return io;
}

async function getPeerSocketId(userId: string): Promise<string | null> {
    const roomId = await matchmakingStore.getUserRoom(userId);
    if (!roomId) return null;

    const peerId = await matchmakingStore.getPeerId(roomId, userId);
    if (!peerId) return null;

    return matchmakingStore.getUserSocket(peerId);
}

export async function relayOffer(socket: AuthedSocket, offer: unknown): Promise<void> {
    const peerSocketId = await getPeerSocketId(socket.userId);
    if (peerSocketId) {
        getIo().to(peerSocketId).emit("offer", { offer });
    }
}

export async function relayAnswer(socket: AuthedSocket, answer: unknown): Promise<void> {
    const peerSocketId = await getPeerSocketId(socket.userId);
    if (peerSocketId) {
        getIo().to(peerSocketId).emit("answer", { answer });
    }
}

export async function relayIceCandidate(socket: AuthedSocket, candidate: unknown): Promise<void> {
    const peerSocketId = await getPeerSocketId(socket.userId);
    if (peerSocketId) {
        getIo().to(peerSocketId).emit("ice-candidate", { candidate });
    }
}

export async function relayMessage(socket: AuthedSocket, text: string): Promise<void> {
    const trimmed = text.trim();
    if (trimmed.length === 0 || trimmed.length > 500) return;

    const peerSocketId = await getPeerSocketId(socket.userId);
    if (!peerSocketId) return;

    getIo().to(peerSocketId).emit("receive-message", { text: trimmed, fromSelf: false });
    getIo().to(socket.id).emit("receive-message", { text: trimmed, fromSelf: true });
}
