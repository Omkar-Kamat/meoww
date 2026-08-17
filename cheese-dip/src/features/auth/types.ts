export interface SessionUser {
  id: string;
  name: string;
  username: string;
  email: string;
  isEmailVerified: boolean;
  profilePhotoUrl?: string;
}

export interface AuthState {
  user: SessionUser | null;
  isAuthChecked: boolean;
}
