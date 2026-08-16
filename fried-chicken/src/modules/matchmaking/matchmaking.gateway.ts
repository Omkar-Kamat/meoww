// registerMatchmakingHandlers(io: Server, socket: Socket) — binds socket.on("search", ...), socket.on("cancel-search", ...), socket.on("leave-room", ...), socket.on("disconnect", ...) to service calls

// src/modules/matchmaking/matchmaking.gateway.ts
import type { Server, Socket } from "socket.io";
import * as matchmakingService from "./matchmaking.service.js";
import { createModuleLogger } from "../../utils/logger.js";
import type { AuthedSocket } from "./matchmaking.types.js";

const log = createModuleLogger("matchmaking-gateway");

function safeHandler<Args extends unknown[]>(
    socket: Socket,
    eventName: string,
    fn: (...args: Args) => Promise<void>,
) {
    return (...args: Args): void => {
        fn(...args).catch((err: unknown) => {
            log.error({ err, userId: socket.userId, event: eventName }, "Error in socket handler");
            socket.emit("error", { message: "An unexpected error occurred." });
        });
    };
}

export function registerMatchmakingHandlers(io: Server, socket: Socket): void {
    if (!socket.userId) {
        socket.disconnect(true);
        return;
    }

    const authedSocket: AuthedSocket = { id: socket.id, userId: socket.userId };

    socket.on(
        "search",
        safeHandler(socket, "search", () => matchmakingService.handleSearch(authedSocket)),
    );

    socket.on(
        "cancel-search",
        safeHandler(socket, "cancel-search", () =>
            matchmakingService.handleCancelSearch(authedSocket.userId),
        ),
    );

    socket.on(
        "leave-room",
        safeHandler(socket, "leave-room", () =>
            matchmakingService.handleLeaveRoom(authedSocket.userId),
        ),
    );

    socket.on(
        "disconnect",
        safeHandler(socket, "disconnect", () =>
            matchmakingService.handleDisconnect(authedSocket.userId),
        ),
    );
}
