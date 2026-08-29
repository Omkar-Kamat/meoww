export type MatchStatus = "idle" | "queued" | "matched" | "skipping";

export interface MatchedPayload {
    roomId: string;
    isInitiator: boolean;
    peerId: string;
}
