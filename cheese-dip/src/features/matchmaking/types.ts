export type MatchStatus = "idle" | "queued" | "matched";

export interface MatchedPayload {
  roomId: string;
  isInitiator: boolean;
  peerId: string;
}

export interface MatchResult {
  roomId: string;
  isInitiator: boolean;
  peerSocketId?: string;
  peerId?: string;
}
