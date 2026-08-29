import type { Socket } from "socket.io";
import "socket.io";

declare module "socket.io" {
    interface Socket {
        userId?: string;
        tokenExp?: number;
        tokenWarningTimer?: NodeJS.Timeout | undefined;
        tokenExpiryTimer?: NodeJS.Timeout | undefined;
    }
}

export interface AuthedSocket extends Socket {
    userId: string;
}

export interface EmitAction {
    target: string;
    event: string;
    payload: unknown;
}
