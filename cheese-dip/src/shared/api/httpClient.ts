import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

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
        await api.post("/api/auth/refresh");
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
  const skipUrls = ["/api/auth/login", "/api/auth/signup", "/api/auth/refresh"];
  return skipUrls.some((skipUrl) => url.includes(skipUrl));
}
