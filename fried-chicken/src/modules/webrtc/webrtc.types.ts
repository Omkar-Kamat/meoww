import type { AuthedSocket } from "../../realtime/socket.types.js";
export type { AuthedSocket };

export interface OfferPayload {
    offer: unknown;
}

export interface AnswerPayload {
    answer: unknown;
}

export interface IceCandidatePayload {
    candidate: unknown;
}

export interface MessagePayload {
    text: string;
}

export interface EmitAction {
    target: string;
    event: string;
    payload: unknown;
}
