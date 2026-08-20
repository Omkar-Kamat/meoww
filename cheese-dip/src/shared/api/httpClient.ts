import axios from "axios";

import { API_URL } from "../config/env";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

let refreshPromise: Promise<unknown> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (shouldSkipRefresh(originalRequest.url)) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api.post("/api/auth/refresh").finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;
        // Fix Axios double-stringification of JSON payloads on retry
        if (
          originalRequest.data &&
          typeof originalRequest.data === "string" &&
          originalRequest.headers?.["Content-Type"]?.includes("application/json")
        ) {
          try {
            originalRequest.data = JSON.parse(originalRequest.data);
          } catch {
            // keep as string if parsing fails
          }
        }
        return api(originalRequest);
      } catch (refreshError: unknown) {
        // Handle refresh failure (e.g., redirect to login)
        if (axios.isAxiosError(refreshError) && (refreshError.response?.status === 401 || refreshError.response?.status === 403)) {
          window.dispatchEvent(new Event("auth-expired"));
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

function shouldSkipRefresh(url?: string): boolean {
  if (!url) return false;
  // Skip all auth endpoints to prevent unauthenticated 401s (e.g. invalid OTP, wrong password) from triggering a refresh
  return url.includes("/api/auth/");
}
