// src/realtime/socket.types.ts
import "socket.io";

declare module "socket.io" {
    interface Socket {
        userId?: string;
        tokenExp?: number;
        tokenWarningTimer?: NodeJS.Timeout | undefined;
        tokenExpiryTimer?: NodeJS.Timeout | undefined;
    }
}
