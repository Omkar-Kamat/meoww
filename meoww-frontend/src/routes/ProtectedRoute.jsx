import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
