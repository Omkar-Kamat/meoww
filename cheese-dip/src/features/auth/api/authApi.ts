import { api } from "../../../shared/api/httpClient";
import type { SessionUser } from "../types";

export const authApi = {
  login: async (credentials: Record<string, unknown>) => {
    const res = await api.post("/api/auth/login", credentials);
    return res.data;
  },
  signup: async (data: FormData) => {
    const res = await api.post("/api/auth/signup", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  verifyOtp: async (data: { identifier: string; code: string }) => {
    const res = await api.post("/api/auth/verify", data);
    return res.data;
  },
  resendOtp: async (data: { identifier: string }) => {
    const res = await api.post("/api/auth/resend-verification", data);
    return res.data;
  },
  forgotPassword: async (data: { email: string }) => {
    const res = await api.post("/api/auth/forgot-password", data);
    return res.data;
  },
  resetPassword: async (data: Record<string, unknown>) => {
    const res = await api.post("/api/auth/reset-password", data);
    return res.data;
  },
  logout: async () => {
    await api.post("/api/auth/logout");
  },
  fetchMe: async (): Promise<SessionUser> => {
    const res = await api.get("/api/users/me");
    return res.data.data;
  },
};
