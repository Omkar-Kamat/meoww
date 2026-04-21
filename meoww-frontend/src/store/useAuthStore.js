import { create } from "zustand";
import api from "../api/axios";
import { socket } from "../socket/socket";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthChecked: false,

  fetchMe: async () => {
    try {
      const { data } = await api.get("/api/auth/me");
      set({ user: data, isAuthChecked: true });
    } catch {
      set({ user: null, isAuthChecked: true });
    }
  },

  logout: async () => {
    // Disconnect socket BEFORE calling the API and redirecting.
    // If we redirect first, the socket cleanup in ChatPage's useEffect
    // return function never runs, leaving the socket open until the
    // browser closes the connection on navigation.
    if (socket.connected) {
      socket.disconnect();
    }

    try {
      await api.post("/api/auth/logout");
    } catch {
      // Even if the API call fails (e.g. network error), we still
      // clear local state and redirect — the server's refresh token
      // will expire naturally.
    }

    set({ user: null });
    window.location.href = "/login";
  },
}));
