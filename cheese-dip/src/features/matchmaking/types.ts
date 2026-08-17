export type MatchStatus = "idle" | "queued" | "matched";

export interface MatchedPayload {
  roomId: string;
  isInitiator: boolean;
}

export interface MatchResult {
  roomId: string;
  isInitiator: boolean;
  peerSocketId?: string;
}
