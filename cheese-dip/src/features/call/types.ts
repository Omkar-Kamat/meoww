export interface IceServer {
  urls: string;
  username?: string;
  credential?: string;
}

export interface TurnCredentialsResponse {
  iceServers: IceServer[];
  expiresAt: number;
}

export interface ConnectionStats {
  bitrate: number;
  quality: "good" | "poor" | "offline";
}

export interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  stats: ConnectionStats;
  isConnecting: boolean;
  cleanupAll: () => void;
  // Expose these if needed by other orchestrators, but mostly managed internally
}
