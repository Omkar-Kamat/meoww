import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "./socketEvents";

const URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const socketClient: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL, {
  autoConnect: false,
  withCredentials: true,
});
