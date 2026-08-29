import { create } from "zustand";
import type { AuthState, SessionUser } from "../types";
import { authApi } from "../api/authApi";
import { socketClient } from "../../../shared/realtime/socketClient";

interface AuthStore extends AuthState {
    isRefreshing: boolean;
    fetchMe: () => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: SessionUser | null) => void;
    setIsRefreshing: (val: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    isAuthChecked: false,
    isRefreshing: false,
    setIsRefreshing: (val) => set({ isRefreshing: val }),
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
            // ignore logout errors
        } finally {
            set({ user: null });
            socketClient.disconnect();
        }
    },
}));
