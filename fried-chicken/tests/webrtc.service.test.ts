import { describe, it, expect, vi } from "vitest";
import { createWebrtcService } from "../src/modules/webrtc/webrtc.service.js";
import type { AuthedSocket } from "../src/modules/webrtc/webrtc.types.js";

describe("webrtc.service", () => {
    it("should relay offer to peer", async () => {
        const getPeerSocketId = vi.fn().mockResolvedValue("peerSocket123");
        const service = createWebrtcService(getPeerSocketId);

        const socket = { id: "mySocket", userId: "userA" } as AuthedSocket;
        const offer = { type: "offer", sdp: "abc" };

        const actions = await service.relayOffer(socket, offer);

        expect(getPeerSocketId).toHaveBeenCalledWith("userA");
        expect(actions).toEqual([
            {
                target: "peerSocket123",
                event: "offer",
                payload: { offer },
            },
        ]);
    });

    it("should return empty array if peer not found for offer", async () => {
        const getPeerSocketId = vi.fn().mockResolvedValue(null);
        const service = createWebrtcService(getPeerSocketId);

        const socket = { id: "mySocket", userId: "userA" } as AuthedSocket;
        const offer = { type: "offer", sdp: "abc" };

        const actions = await service.relayOffer(socket, offer);
        expect(actions).toEqual([]);
    });

    it("should relay answer to peer", async () => {
        const getPeerSocketId = vi.fn().mockResolvedValue("peerSocket123");
        const service = createWebrtcService(getPeerSocketId);

        const socket = { id: "mySocket", userId: "userA" } as AuthedSocket;
        const answer = { type: "answer", sdp: "def" };

        const actions = await service.relayAnswer(socket, answer);
        expect(actions).toEqual([
            {
                target: "peerSocket123",
                event: "answer",
                payload: { answer },
            },
        ]);
    });

    it("should relay ice-candidate to peer", async () => {
        const getPeerSocketId = vi.fn().mockResolvedValue("peerSocket123");
        const service = createWebrtcService(getPeerSocketId);

        const socket = { id: "mySocket", userId: "userA" } as AuthedSocket;
        const candidate = { candidate: "candidate-str" };

        const actions = await service.relayIceCandidate(socket, candidate);
        expect(actions).toEqual([
            {
                target: "peerSocket123",
                event: "ice-candidate",
                payload: { candidate },
            },
        ]);
    });

    it("should relay message to peer and self", async () => {
        const getPeerSocketId = vi.fn().mockResolvedValue("peerSocket123");
        const service = createWebrtcService(getPeerSocketId);

        const socket = { id: "mySocket", userId: "userA" } as AuthedSocket;
        const actions = await service.relayMessage(socket, "hello world ");

        expect(actions).toEqual([
            {
                target: "peerSocket123",
                event: "receive-message",
                payload: { text: "hello world", fromSelf: false },
            },
            {
                target: "mySocket",
                event: "receive-message",
                payload: { text: "hello world", fromSelf: true },
            },
        ]);
    });

    it("should ignore empty messages", async () => {
        const getPeerSocketId = vi.fn().mockResolvedValue("peerSocket123");
        const service = createWebrtcService(getPeerSocketId);

        const socket = { id: "mySocket", userId: "userA" } as AuthedSocket;
        const actions = await service.relayMessage(socket, "   ");

        expect(actions).toEqual([]);
    });

    it("should ignore too long messages", async () => {
        const getPeerSocketId = vi.fn().mockResolvedValue("peerSocket123");
        const service = createWebrtcService(getPeerSocketId);

        const socket = { id: "mySocket", userId: "userA" } as AuthedSocket;
        const longText = "a".repeat(501);
        const actions = await service.relayMessage(socket, longText);

        expect(actions).toEqual([]);
    });

    it("should return empty if peer not found for message", async () => {
        const getPeerSocketId = vi.fn().mockResolvedValue(null);
        const service = createWebrtcService(getPeerSocketId);

        const socket = { id: "mySocket", userId: "userA" } as AuthedSocket;
        const actions = await service.relayMessage(socket, "hello");

        expect(actions).toEqual([]);
    });
});
