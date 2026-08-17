import { useEffect } from "react";
import { AppProviders } from "./providers";
import { AppRoutes } from "./routes";
import { useAuthStore } from "../features/auth/store/useAuthStore";
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

  useEffect(() => {
    if (user) {
      if (!socketClient.connected) {
        socketClient.connect();
      }

      const handleTokenExpired = () => {
        useAuthStore.getState().logout();
      };
      
      const handleSessionTerminated = () => {
        useAuthStore.getState().logout();
      };

      socketClient.on("token-expired", handleTokenExpired);
      socketClient.on("session-terminated", handleSessionTerminated);

      return () => {
        socketClient.off("token-expired", handleTokenExpired);
        socketClient.off("session-terminated", handleSessionTerminated);
        socketClient.disconnect();
      };
    } else {
      if (socketClient.connected) {
        socketClient.disconnect();
      }
    }
  }, [user]);

  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
};
