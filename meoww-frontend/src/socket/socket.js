import { io } from "socket.io-client";

/**
 * Plain socket instance — no store imports here.
 *
 * Keeping this module import-free prevents a circular dependency:
 *   useAuthStore → api/axios → (nothing)
 *   ChatPage → socket → useAuthStore  ← was circular
 *
 * All event handling (session-terminated, token-expired, etc.)
 * lives in ChatPage where it has access to React state and stores.
 *
 * reconnection: false — we manage reconnection manually so we can
 * call /api/auth/refresh BEFORE retrying. The default auto-reconnect
 * would retry with the same expired cookie and fail in a tight loop.
 */
export const socket = io(import.meta.env.VITE_API_URL, {
  withCredentials: true,
  autoConnect: false,
  reconnection: false,
});
