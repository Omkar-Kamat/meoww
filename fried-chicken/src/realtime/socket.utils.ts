import type { Socket } from "socket.io";
import type { EmitAction } from "./socket.types.js";
import { createModuleLogger } from "../utils/logger.js";

const log = createModuleLogger("gateway-handler");

export interface BaseAuthedSocket extends Socket {
    userId: string;
}

export function safeHandler<Args extends unknown[]>(
    socket: BaseAuthedSocket,
    eventName: string,
    fn: (...args: Args) => Promise<EmitAction[]>,
) {
    return (...args: Args): void => {
        Promise.resolve()
            .then(() => fn(...args))
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
                log.error(
                    { err, userId: socket.userId, event: eventName },
                    "Error in socket handler",
                );
                socket.emit("error", { message: "An unexpected error occurred." });
            });
    };
}
