import { api } from "../../../shared/api/httpClient";
import type { TurnCredentialsResponse } from "../types";

export const webrtcApi = {
    getTurnCredentials: async (): Promise<TurnCredentialsResponse> => {
        const res = await api.get("/api/webrtc/turn-credentials");
        return res.data;
    },
};
