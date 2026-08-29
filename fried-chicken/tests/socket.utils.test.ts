import { describe, it, expect, vi } from "vitest";
import { safeHandler, type BaseAuthedSocket } from "../src/realtime/socket.utils.js";

describe("socket.utils", () => {
    describe("safeHandler", () => {
        it("should emit to self if target is socket.id", async () => {
            const emitMock = vi.fn();
            const toMock = vi.fn();
            const socket = {
                id: "socketSelf",
                userId: "userA",
                emit: emitMock,
                to: toMock,
            } as unknown as BaseAuthedSocket;

            const fn = vi
                .fn()
                .mockResolvedValue([
                    { target: "socketSelf", event: "test-event", payload: { data: 123 } },
                ]);

            const handler = safeHandler(socket, "test-action", fn);
            handler("arg1");

            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(fn).toHaveBeenCalledWith("arg1");
            expect(emitMock).toHaveBeenCalledWith("test-event", { data: 123 });
            expect(toMock).not.toHaveBeenCalled();
        });

        it("should route to target using socket.to if target is not socket.id", async () => {
            const emitMock = vi.fn();
            const toEmitMock = vi.fn();
            const toMock = vi.fn().mockReturnValue({ emit: toEmitMock });

            const socket = {
                id: "socketSelf",
                userId: "userA",
                emit: emitMock,
                to: toMock,
            } as unknown as BaseAuthedSocket;

            const fn = vi
                .fn()
                .mockResolvedValue([
                    { target: "socketOther", event: "test-event-other", payload: { data: 456 } },
                ]);

            const handler = safeHandler(socket, "test-action", fn);
            handler("arg2");

            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(fn).toHaveBeenCalledWith("arg2");
            expect(emitMock).not.toHaveBeenCalled();
            expect(toMock).toHaveBeenCalledWith("socketOther");
            expect(toEmitMock).toHaveBeenCalledWith("test-event-other", { data: 456 });
        });

        it("should catch errors and emit an error event", async () => {
            const emitMock = vi.fn();
            const toMock = vi.fn();

            const socket = {
                id: "socketSelf",
                userId: "userA",
                emit: emitMock,
                to: toMock,
            } as unknown as BaseAuthedSocket;

            const fn = vi.fn().mockRejectedValue(new Error("Test Error"));

            const handler = safeHandler(socket, "test-action", fn);
            handler();

            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(emitMock).toHaveBeenCalledWith("error", {
                message: "An unexpected error occurred.",
            });
        });

        it("should catch synchronous errors inside handler (e.g., Zod throws)", async () => {
            const emitMock = vi.fn();
            const toMock = vi.fn();

            const socket = {
                id: "socketSelf",
                userId: "userA",
                emit: emitMock,
                to: toMock,
            } as unknown as BaseAuthedSocket;

            const fn = vi.fn().mockImplementation(() => {
                throw new Error("Invalid payload");
            });

            const handler = safeHandler(socket, "test-action", fn);

            handler();

            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(emitMock).toHaveBeenCalledWith("error", {
                message: "An unexpected error occurred.",
            });
        });
    });
});
