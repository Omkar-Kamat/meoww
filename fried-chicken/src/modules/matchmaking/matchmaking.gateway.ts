// registerMatchmakingHandlers(io: Server, socket: Socket) — binds socket.on("search", ...), socket.on("cancel-search", ...), socket.on("leave-room", ...), socket.on("disconnect", ...) to service calls

import type { Socket } from "socket.io";
import type { MatchmakingService } from "./matchmaking.service.js";
import { createModuleLogger } from "../../utils/logger.js";
import type { AuthedSocket } from "./matchmaking.types.js";
import type { EmitAction } from "../../realtime/socket.types.js";

const log = createModuleLogger("matchmaking-gateway");

function safeHandler<Args extends unknown[]>(
    socket: AuthedSocket,
    eventName: string,
    fn: (...args: Args) => Promise<EmitAction[]>,
) {
    return (...args: Args) => {
        fn(...args)
            .then((actions) => {
                for (const action of actions) {
                    if (action.target === socket.id) {
                        socket.emit(action.event, action.payload);
                    } else {
                        socket.to(action.target).emit(action.event, action.payload);
                    }
                }
            })
            .catch((err: unknown) => {
                log.error({ err, userId: socket.userId, event: eventName }, "Error in socket handler");
                socket.emit("error", { message: "An unexpected error occurred." });
            });
    };
}

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
        safeHandler(authedSocket, "leave-room", () =>
            service.handleLeaveRoom(authedSocket.userId),
        ),
    );

    socket.on(
        "disconnect",
        safeHandler(authedSocket, "disconnect", () =>
            service.handleDisconnect(authedSocket.userId),
        ),
    );
}
