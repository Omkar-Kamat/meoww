import type { Socket } from "socket.io";
import type { WebrtcService } from "./webrtc.service.js";
import { createModuleLogger } from "../../utils/logger.js";
import type {
    AuthedSocket,
    OfferPayload,
    AnswerPayload,
    IceCandidatePayload,
    MessagePayload,
    EmitAction,
} from "./webrtc.types.js";
import { z } from "zod";

const offerPayloadSchema = z.object({ offer: z.any() });
const answerPayloadSchema = z.object({ answer: z.any() });
const iceCandidatePayloadSchema = z.object({ candidate: z.any() });
const messagePayloadSchema = z.object({ text: z.string().max(500) });

const log = createModuleLogger("webrtc-gateway");

function safeHandler<Args extends unknown[]>(
    socket: Socket,
    eventName: string,
    fn: (...args: Args) => Promise<EmitAction[] | void>,
) {
    return (...args: Args): void => {
        fn(...args)
            .then((actions) => {
                if (actions && Array.isArray(actions)) {
                    for (const action of actions) {
                        if (action.target === socket.id) {
                            socket.emit(action.event, action.payload);
                        } else {
                            socket.to(action.target).emit(action.event, action.payload);
                        }
                    }
                }
            })
            .catch((err: unknown) => {
                log.error({ err, userId: socket.userId, event: eventName }, "Error in socket handler");
                socket.emit("error", { message: "An unexpected error occurred." });
            });
    };
}

function parseSocketPayload<T>(schema: z.ZodType<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new Error(`Invalid payload: ${result.error.message}`);
    }
    return result.data;
}

export function registerWebrtcHandlers(service: WebrtcService, socket: Socket): void {
    if (!socket.userId) return;

    const authedSocket: AuthedSocket = { id: socket.id, userId: socket.userId };

    socket.on(
        "offer",
        safeHandler(socket, "offer", (data: unknown) => {
            const parsed = parseSocketPayload(offerPayloadSchema, data);
            return service.relayOffer(authedSocket, parsed.offer);
        }),
    );

    socket.on(
        "answer",
        safeHandler(socket, "answer", (data: unknown) => {
            const parsed = parseSocketPayload(answerPayloadSchema, data);
            return service.relayAnswer(authedSocket, parsed.answer);
        }),
    );

    socket.on(
        "ice-candidate",
        safeHandler(socket, "ice-candidate", (data: unknown) => {
            const parsed = parseSocketPayload(iceCandidatePayloadSchema, data);
            return service.relayIceCandidate(authedSocket, parsed.candidate);
        }),
    );

    socket.on(
        "send-message",
        safeHandler(socket, "send-message", (data: unknown) => {
            const parsed = parseSocketPayload(messagePayloadSchema, data);
            return service.relayMessage(authedSocket, parsed.text);
        }),
    );
}
