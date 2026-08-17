export interface ServerToClientEvents {
  queued: () => void;
  matched: (payload: { roomId: string; isInitiator: boolean }) => void;
  "peer-disconnected": () => void;
  
  // Stubs for future features (WebRTC, chat)
  offer: (payload: { offer: RTCSessionDescriptionInit }) => void;
  answer: (payload: { answer: RTCSessionDescriptionInit }) => void;
  "ice-candidate": (payload: { candidate: RTCIceCandidateInit }) => void;
  "receive-message": (message: { text: string; fromSelf: boolean }) => void;
  "token-expired": () => void;
}

export interface ClientToServerEvents {
  search: () => void;
  "cancel-search": () => void;
  "leave-room": () => void;
  
  // Stubs for future features
  offer: (payload: { offer: RTCSessionDescriptionInit }) => void;
  answer: (payload: { answer: RTCSessionDescriptionInit }) => void;
  "ice-candidate": (payload: { candidate: RTCIceCandidateInit }) => void;
  "send-message": (payload: { text: string }) => void;
}
