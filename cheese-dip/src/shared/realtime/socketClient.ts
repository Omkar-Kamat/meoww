import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "./socketEvents";

import { API_URL } from "../config/env";

export const socketClient: Socket<ServerToClientEvents, ClientToServerEvents> = io(API_URL, {
  autoConnect: false,
  withCredentials: true,
});
