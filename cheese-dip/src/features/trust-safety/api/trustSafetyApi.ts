import { api } from "../../../shared/api/httpClient";

export const trustSafetyApi = {
  report: async (data: { reportedUserId: string; roomId: string; reason: string }) => {
    const res = await api.post("/api/trust-safety/report", data);
    return res.data;
  },
  block: async (data: { blockedUserId: string }) => {
    const res = await api.post("/api/trust-safety/block", data);
    return res.data;
  },
};
