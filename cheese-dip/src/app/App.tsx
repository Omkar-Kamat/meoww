import { useEffect } from "react";
import { AppProviders } from "./providers";
import { AppRoutes } from "./routes";
import { useAuthStore } from "../features/auth/store/useAuthStore";

export const App = () => {
  const { fetchMe } = useAuthStore();

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

  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
};
