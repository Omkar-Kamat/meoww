// MatchResult, AuthedSocket, RoomRecord — exported types

// src/modules/matchmaking/matchmaking.types.ts
import type { AuthedSocket } from "../../realtime/socket.types.js";
export type { AuthedSocket };

export interface RoomRecord {
    user1: string;
    user2: string;
}

export interface MatchResult {
    roomId: string;
    isInitiator: boolean;
    peerSocketId: string;
}
