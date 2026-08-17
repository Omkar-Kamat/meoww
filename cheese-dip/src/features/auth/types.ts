export interface SessionUser {
  id: string;
  name: string;
  username: string;
  email: string;
  isEmailVerified: boolean;
  profilePhotoUrl?: string;
}

export interface LoginRequest {
  email?: string;
  username?: string;
  password?: string;
}

export interface ResetPasswordRequest {
  userId?: string;
  token?: string;
  password?: string;
}

export interface AuthState {
  user: SessionUser | null;
  isAuthChecked: boolean;
}
