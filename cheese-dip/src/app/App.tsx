import { useEffect } from "react";
import { AppProviders } from "./providers";
import { AppRoutes } from "./routes";
import { useAuthStore } from "../features/auth/store/useAuthStore";
import { authApi } from "../features/auth/api/authApi";
import { socketClient } from "../shared/realtime/socketClient";

export const App = () => {
  const { fetchMe, user } = useAuthStore();

  useEffect(() => {
    // Attempt to fetch current user session on mount
    fetchMe();

    const handleAuthExpired = () => {
      useAuthStore.getState().logout();
    };

    window.addEventListener("auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("auth-expired", handleAuthExpired);
    };
  }, [fetchMe]);

  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      if (!socketClient.connected) {
        socketClient.connect();
      }

      const handleTokenExpired = (payload: { code: string; message: string }) => {
        alert(payload.message || "Your session has expired. Please log in again.");
        useAuthStore.getState().logout();
      };
      
      const handleTokenExpiringSoon = async () => {
        try {
          await authApi.refresh();
          // Note: Removed the deliberate disconnect/connect cycle. 
          // Re-auth is cookie-based, so it will seamlessly be picked up 
          // on the next natural reconnect without interrupting active calls.
        } catch {
          useAuthStore.getState().logout();
        }
      };

      const handleSessionTerminated = (payload: { reason: string }) => {
        alert(payload.reason === "another_session_detected" 
          ? "You have been logged out because you logged in on another device." 
          : "Your session has been terminated.");
        useAuthStore.getState().logout();
      };

      socketClient.on("token-expired", handleTokenExpired);
      socketClient.on("token-expiring-soon", handleTokenExpiringSoon);
      socketClient.on("session-terminated", handleSessionTerminated);

      return () => {
        socketClient.off("token-expired", handleTokenExpired);
        socketClient.off("token-expiring-soon", handleTokenExpiringSoon);
        socketClient.off("session-terminated", handleSessionTerminated);
        socketClient.disconnect();
      };
    } else {
      if (socketClient.connected) {
        socketClient.disconnect();
      }
    }
  }, [userId]);

  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
};
