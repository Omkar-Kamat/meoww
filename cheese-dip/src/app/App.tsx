import { useEffect, useState } from "react";
import { AppProviders } from "./providers";
import { AppRoutes } from "./routes";
import { useAuthStore } from "../features/auth/store/useAuthStore";
import { authApi } from "../features/auth/api/authApi";
import { socketClient } from "../shared/realtime/socketClient";

export const App = () => {
  const { fetchMe, user, isRefreshing, setIsRefreshing } = useAuthStore();
  const [isReconnecting, setIsReconnecting] = useState(false);

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
      let connectTimer: ReturnType<typeof setTimeout>;
      if (!socketClient.connected) {
        connectTimer = setTimeout(() => socketClient.connect(), 0);
      }

      const handleTokenExpired = (payload: { code: string; message: string }) => {
        alert(payload.message || "Your session has expired. Please log in again.");
        useAuthStore.getState().logout();
      };
      
      const handleTokenExpiringSoon = async () => {
        try {
          setIsRefreshing(true);
          await authApi.refresh();
          socketClient.disconnect();
          socketClient.connect();
        } catch {
          useAuthStore.getState().logout();
        } finally {
          setIsRefreshing(false);
        }
      };

      const handleSessionTerminated = (payload: { reason: string }) => {
        alert(payload.reason === "another_session_detected" 
          ? "You have been logged out because you logged in on another device." 
          : "Your session has been terminated.");
        useAuthStore.getState().logout();
      };

      const handleConnect = () => setIsReconnecting(false);
      const handleDisconnect = () => setIsReconnecting(true);
      const handleSocketError = (payload: { message: string }) => {
        console.error("Socket error:", payload.message);
      };

      socketClient.on("token-expired", handleTokenExpired);
      socketClient.on("token-expiring-soon", handleTokenExpiringSoon);
      socketClient.on("session-terminated", handleSessionTerminated);
      socketClient.on("connect", handleConnect);
      socketClient.on("disconnect", handleDisconnect);
      socketClient.on("error", handleSocketError);

      return () => {
        clearTimeout(connectTimer);
        socketClient.off("token-expired", handleTokenExpired);
        socketClient.off("token-expiring-soon", handleTokenExpiringSoon);
        socketClient.off("session-terminated", handleSessionTerminated);
        socketClient.off("connect", handleConnect);
        socketClient.off("disconnect", handleDisconnect);
        socketClient.off("error", handleSocketError);
        socketClient.disconnect();
      };
    } else {
      if (socketClient.connected) {
        socketClient.disconnect();
      }
    }
  }, [userId, setIsRefreshing]);

  return (
    <AppProviders>
      {isRefreshing && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", zIndex: 9999,
          backgroundColor: "#17a2b8", color: "white", textAlign: "center", padding: "5px", fontSize: "14px"
        }}>
          Refreshing session...
        </div>
      )}
      {isReconnecting && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", zIndex: 9999,
          backgroundColor: "#ffc107", color: "black", textAlign: "center", padding: "5px", fontSize: "14px"
        }}>
          Reconnecting...
        </div>
      )}
      <AppRoutes />
    </AppProviders>
  );
};
