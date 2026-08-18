export interface ServerToClientEvents {
  queued: () => void;
  matched: (payload: { roomId: string; isInitiator: boolean; peerId: string }) => void;
  "peer-disconnected": () => void;
  
  // Stubs for future features (WebRTC, chat)
  offer: (payload: { offer: RTCSessionDescriptionInit; roomId?: string }) => void;
  answer: (payload: { answer: RTCSessionDescriptionInit; roomId?: string }) => void;
  "ice-candidate": (payload: { candidate: RTCIceCandidateInit; roomId?: string }) => void;
  "receive-message": (message: { text: string; fromSelf: boolean }) => void;
  "token-expired": () => void;
  "token-expiring-soon": () => void;
  "session-terminated": () => void;
}

export interface ClientToServerEvents {
  search: () => void;
  "cancel-search": () => void;
  "leave-room": (callback?: () => void) => void;
  
  // Stubs for future features
  offer: (payload: { offer: RTCSessionDescriptionInit }) => void;
  answer: (payload: { answer: RTCSessionDescriptionInit }) => void;
  "ice-candidate": (payload: { candidate: RTCIceCandidateInit }) => void;
  "send-message": (payload: { text: string }) => void;
}
