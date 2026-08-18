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
        return api(originalRequest);
      } catch (refreshError) {
        // Handle refresh failure (e.g., redirect to login)
        window.dispatchEvent(new Event("auth-expired"));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

function shouldSkipRefresh(url?: string): boolean {
  if (!url) return false;
  const skipUrls = ["/api/auth/login", "/api/auth/signup", "/api/auth/refresh", "/api/auth/logout"];
  return skipUrls.some((skipUrl) => url.includes(skipUrl));
}
