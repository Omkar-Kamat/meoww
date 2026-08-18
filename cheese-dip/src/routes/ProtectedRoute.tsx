import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthSession } from "../features/auth";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isAuthChecked } = useAuthSession();

  if (!isAuthChecked) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
