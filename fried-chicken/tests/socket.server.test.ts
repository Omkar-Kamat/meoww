/* eslint-disable */
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { Server, type Socket } from "socket.io";
import { mountGateways } from "../src/realtime/socket.server.js";
import * as matchmakingService from "../src/modules/matchmaking/matchmaking.service.js";

vi.mock("../src/modules/matchmaking/matchmaking.service.js", () => ({
    createMatchmakingService: vi.fn(),
}));
vi.mock("../src/modules/webrtc/webrtc.service.js", () => ({
    createWebrtcService: vi.fn(),
}));

describe("socket.server", () => {
    let io: Server;
    let mockHandleDisconnect: Mock<(userId: string) => Promise<any[]>>;
    let mockTo: Mock;
    let mockEmit: Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        
        io = new Server();
        mockTo = vi.fn().mockReturnValue(io);
        mockEmit = vi.fn();
        io.to = mockTo as unknown as typeof io.to;
        io.emit = mockEmit as unknown as typeof io.emit;

        mockHandleDisconnect = vi.fn().mockResolvedValue([]);
        
        (matchmakingService.createMatchmakingService as Mock).mockReturnValue({
            handleDisconnect: mockHandleDisconnect,
        } as unknown as ReturnType<typeof matchmakingService.createMatchmakingService>);

        mountGateways(io);
    });

    it("should process actions returned by handleDisconnect and emit them to targets", async () => {
        const connectionHandler = io.listeners("connection")[0] as (socket: Socket) => void;

        const listeners: Record<string, Function> = {};
        const mockSocket = {
            id: "socketA",
            userId: "userA",
            on: (event: string, fn: Function) => {
                listeners[event] = fn;
                return mockSocket;
            },
            emit: vi.fn(),
        } as unknown as Socket;

        connectionHandler(mockSocket);

        const disconnectHandler = listeners["disconnect"] as () => void;

        mockHandleDisconnect.mockResolvedValue([
            { target: "socketB", event: "peer-disconnected", payload: undefined }
        ]);

        disconnectHandler();
        await Promise.resolve();

        expect(mockHandleDisconnect).toHaveBeenCalledWith("userA");
        expect(mockTo).toHaveBeenCalledWith("socketB");
        expect(mockEmit).toHaveBeenCalledWith("peer-disconnected", undefined);
    });
});
