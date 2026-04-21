import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/useAuthStore";
import ProtectedRoute from "./routes/ProtectedRoute";
import ToastContainer from "./components/ToastContainer";

// Eager imports — avoids Tailwind v4 content-scan timing issues with lazy chunks
import HomePage from "./pages/HomePage";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import Verify from "./auth/Verify";
import ForgotPassword from "./auth/ForgotPassword";
import ResetPassword from "./auth/ResetPassword";
import ChatPage from "./pages/ChatPage";

function PageLoader() {
  return (
    <div className="h-screen flex items-center justify-center bg-base">
      <div className="size-8 rounded-full border-2 border-[rgba(255,255,255,0.12)] border-t-[var(--accent)] spin" />
    </div>
  );
}

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const isAuthChecked = useAuthStore((s) => s.isAuthChecked);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (!isAuthChecked) return <PageLoader />;

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
