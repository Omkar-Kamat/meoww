import type { Server, Socket } from "socket.io";
import * as webrtcService from "./webrtc.service.js";
import { createModuleLogger } from "../../utils/logger.js";
import type {
    AuthedSocket,
    OfferPayload,
    AnswerPayload,
    IceCandidatePayload,
    MessagePayload,
} from "./webrtc.types.js";

const log = createModuleLogger("webrtc-gateway");

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

export function registerWebrtcHandlers(_io: Server, socket: Socket): void {
    if (!socket.userId) return;

    const authedSocket: AuthedSocket = { id: socket.id, userId: socket.userId };

    socket.on(
        "offer",
        safeHandler(socket, "offer", (data: OfferPayload) =>
            webrtcService.relayOffer(authedSocket, data.offer),
        ),
    );

    socket.on(
        "answer",
        safeHandler(socket, "answer", (data: AnswerPayload) =>
            webrtcService.relayAnswer(authedSocket, data.answer),
        ),
    );

    socket.on(
        "ice-candidate",
        safeHandler(socket, "ice-candidate", (data: IceCandidatePayload) =>
            webrtcService.relayIceCandidate(authedSocket, data.candidate),
        ),
    );

    socket.on(
        "send-message",
        safeHandler(socket, "send-message", (data: MessagePayload) =>
            webrtcService.relayMessage(authedSocket, data.text),
        ),
    );
}
