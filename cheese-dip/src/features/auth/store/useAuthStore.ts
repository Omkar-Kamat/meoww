import { create } from "zustand";
import type { AuthState, SessionUser } from "../types";
import { authApi } from "../api/authApi";
import { socketClient } from "../../../shared/realtime/socketClient";

interface AuthStore extends AuthState {
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: SessionUser | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthChecked: false,
  setUser: (user) => set({ user }),
  fetchMe: async () => {
    try {
      const user = await authApi.fetchMe();
      set({ user, isAuthChecked: true });
    } catch {
      set({ user: null, isAuthChecked: true });
    }
  },
  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      set({ user: null });
      socketClient.disconnect();
    }
  },
}));
