// registerMatchmakingHandlers(io: Server, socket: Socket) — binds socket.on("search", ...), socket.on("cancel-search", ...), socket.on("leave-room", ...) to service calls.
// Disconnect handling is centralized in socket.server.ts (mountGateways), which calls mmService.handleDisconnect directly.

import type { Socket } from "socket.io";
import type { MatchmakingService } from "./matchmaking.service.js";
import type { AuthedSocket } from "./matchmaking.types.js";
import { safeHandler } from "../../realtime/socket.utils.js";

export function registerMatchmakingHandlers(service: MatchmakingService, socket: Socket): void {
    if (!socket.userId) {
        socket.disconnect(true);
        return;
    }

    const authedSocket = socket as AuthedSocket;

    socket.on(
        "search",
        safeHandler(authedSocket, "search", () => service.handleSearch(authedSocket)),
    );

    socket.on(
        "cancel-search",
        safeHandler(authedSocket, "cancel-search", () =>
            service.handleCancelSearch(authedSocket.userId),
        ),
    );

    socket.on(
        "leave-room",
        safeHandler(authedSocket, "leave-room", () => service.handleLeaveRoom(authedSocket.userId)),
    );
}
