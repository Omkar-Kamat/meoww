import type { Socket } from "socket.io";
import type { WebrtcService } from "./webrtc.service.js";
import type { AuthedSocket } from "./webrtc.types.js";
import { z } from "zod";

const sdpSchema = z.object({
    type: z.enum(["offer", "answer", "pranswer", "rollback"]),
    sdp: z.string().max(10000),
});

const iceCandidateSchema = z.object({
    candidate: z.string().max(2000),
    sdpMid: z.string().max(255).nullable().optional(),
    sdpMLineIndex: z.number().nullable().optional(),
    usernameFragment: z.string().max(255).nullable().optional(),
});

const offerPayloadSchema = z.object({ offer: sdpSchema, roomId: z.string().max(255).optional() });
const answerPayloadSchema = z.object({ answer: sdpSchema, roomId: z.string().max(255).optional() });
const iceCandidatePayloadSchema = z.object({
    candidate: iceCandidateSchema,
    roomId: z.string().max(255).optional(),
});
const messagePayloadSchema = z.object({ text: z.string().max(500) });

import { safeHandler } from "../../realtime/socket.utils.js";

function parseSocketPayload<T>(schema: z.ZodType<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new Error(`Invalid payload: ${result.error.message}`);
    }
    return result.data;
}

export function registerWebrtcHandlers(service: WebrtcService, socket: Socket): void {
    if (!socket.userId) {
        socket.disconnect(true);
        return;
    }
    const authedSocket = socket as AuthedSocket;

    socket.on(
        "offer",
        safeHandler(authedSocket, "offer", (data: unknown) => {
            const parsed = parseSocketPayload(offerPayloadSchema, data);
            return service.relayOffer(authedSocket, parsed.offer, parsed.roomId);
        }),
    );

    socket.on(
        "answer",
        safeHandler(authedSocket, "answer", (data: unknown) => {
            const parsed = parseSocketPayload(answerPayloadSchema, data);
            return service.relayAnswer(authedSocket, parsed.answer, parsed.roomId);
        }),
    );

    socket.on(
        "ice-candidate",
        safeHandler(authedSocket, "ice-candidate", (data: unknown) => {
            const parsed = parseSocketPayload(iceCandidatePayloadSchema, data);
            return service.relayIceCandidate(authedSocket, parsed.candidate, parsed.roomId);
        }),
    );

    socket.on(
        "send-message",
        safeHandler(authedSocket, "send-message", (data: unknown) => {
            const parsed = parseSocketPayload(messagePayloadSchema, data);
            return service.relayMessage(authedSocket, parsed.text);
        }),
    );
}
