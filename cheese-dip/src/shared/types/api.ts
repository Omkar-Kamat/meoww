export interface User {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface MatchResult {
  roomId: string;
  isInitiator: boolean;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}
