import type { AuthedSocket } from "./webrtc.types.js";
import type { EmitAction } from "../../realtime/socket.types.js";

export interface WebrtcService {
    relayOffer(socket: AuthedSocket, offer: unknown): Promise<EmitAction[]>;
    relayAnswer(socket: AuthedSocket, answer: unknown): Promise<EmitAction[]>;
    relayIceCandidate(socket: AuthedSocket, candidate: unknown): Promise<EmitAction[]>;
    relayMessage(socket: AuthedSocket, text: string): Promise<EmitAction[]>;
}

export function createWebrtcService(
    getPeerSocketId: (userId: string) => Promise<string | null>,
): WebrtcService {
    function relay(eventName: string, payloadKey: string) {
        return async (socket: AuthedSocket, payloadData: unknown): Promise<EmitAction[]> => {
            const peerSocketId = await getPeerSocketId(socket.userId);
            return peerSocketId
                ? [
                      {
                          target: peerSocketId,
                          event: eventName,
                          payload: { [payloadKey]: payloadData },
                      },
                  ]
                : [];
        };
    }

    const relayOffer = relay("offer", "offer");
    const relayAnswer = relay("answer", "answer");
    const relayIceCandidate = relay("ice-candidate", "candidate");

    async function relayMessage(socket: AuthedSocket, text: string): Promise<EmitAction[]> {
        const trimmed = text.trim();
        if (trimmed.length === 0 || trimmed.length > 500) return [];

        const peerSocketId = await getPeerSocketId(socket.userId);
        if (!peerSocketId) return [];

        return [
            {
                target: peerSocketId,
                event: "receive-message",
                payload: { text: trimmed, fromSelf: false },
            },
            {
                target: socket.id,
                event: "receive-message",
                payload: { text: trimmed, fromSelf: true },
            },
        ];
    }

    return {
        relayOffer,
        relayAnswer,
        relayIceCandidate,
        relayMessage,
    };
}
