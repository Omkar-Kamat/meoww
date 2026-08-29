export interface ServerToClientEvents {
    queued: () => void;
    matched: (payload: { roomId: string; isInitiator: boolean; peerId: string }) => void;
    "peer-disconnected": () => void;
    error: (payload: { message: string }) => void;

    offer: (payload: { offer: RTCSessionDescriptionInit; roomId?: string }) => void;
    answer: (payload: { answer: RTCSessionDescriptionInit; roomId?: string }) => void;
    "ice-candidate": (payload: { candidate: RTCIceCandidateInit; roomId?: string }) => void;
    "receive-message": (message: { text: string; fromSelf: boolean }) => void;
    "token-expired": (payload: { code: string; message: string }) => void;
    "token-expiring-soon": (payload: {
        code: string;
        message: string;
        expiresInMs: number;
    }) => void;
    "session-terminated": (payload: { reason: string }) => void;
}

export interface ClientToServerEvents {
    search: () => void;
    "cancel-search": () => void;
    "leave-room": (callback?: () => void) => void;

    offer: (payload: { offer: RTCSessionDescriptionInit; roomId?: string }) => void;
    answer: (payload: { answer: RTCSessionDescriptionInit; roomId?: string }) => void;
    "ice-candidate": (payload: { candidate: RTCIceCandidateInit; roomId?: string }) => void;
    "send-message": (payload: { text: string }) => void;
}
