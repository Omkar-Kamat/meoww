export interface AuthedSocket {
    id: string;
    userId: string;
}

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
