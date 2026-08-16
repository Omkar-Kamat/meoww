// MatchResult, AuthedSocket, RoomRecord — exported types

// src/modules/matchmaking/matchmaking.types.ts
export interface AuthedSocket {
    id: string;
    userId: string;
}

export interface RoomRecord {
    user1: string;
    user2: string;
}

export interface MatchResult {
    roomId: string;
    isInitiator: boolean;
    peerSocketId: string;
}
