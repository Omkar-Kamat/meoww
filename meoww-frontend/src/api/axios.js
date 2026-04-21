import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

/**
 * Routes that should NEVER trigger a token refresh attempt.
 *
 * Critical ones:
 *  - /api/auth/me     — called on every boot by fetchMe(). If the user
 *                       simply isn't logged in, a 401 here is expected and
 *                       normal. We must NOT try to refresh — there's nothing
 *                       to refresh. Without this, boot → 401 → refresh →
 *                       refresh fails → redirect → reload → infinite loop.
 *  - /api/auth/refresh — don't try to refresh a failed refresh (obvious loop)
 *  - All other auth routes — users calling these aren't authenticated yet
 */
const shouldSkipRefresh = (url) => {
  if (!url) return false;
  return (
    url.includes("/api/auth/me") ||
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/signup") ||
    url.includes("/api/auth/verify") ||
    url.includes("/api/auth/resend-otp") ||
    url.includes("/api/auth/refresh") ||
    url.includes("/api/auth/forgot-password") ||
    url.includes("/api/auth/reset-password")
  );
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (!err.response) {
      return Promise.reject(err);
    }

    const status = err.response.status;

    if (
      status === 401 &&
      !originalRequest._retry &&
      !shouldSkipRefresh(originalRequest.url)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(api(originalRequest)),
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/api/auth/refresh");
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);

        // Only redirect if not already on an auth page — safety net
        // against any future route that might trigger this path.
        const authPaths = [
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
        ];
        const alreadyOnAuthPage = authPaths.some((p) =>
          window.location.pathname.startsWith(p),
        );

        if (!alreadyOnAuthPage) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  },
);

export default api;
