import { Routes, Route } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage";
import { ChatPage } from "../pages/ChatPage";
import { SettingsPage } from "../pages/SettingsPage";
import { NotFound } from "../pages/NotFound";
import { ProtectedRoute } from "../routes/ProtectedRoute";
import {
    LoginForm,
    SignupForm,
    VerifyOtpForm,
    ForgotPasswordForm,
    ResetPasswordForm,
} from "../features/auth";

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route path="/verify-otp" element={<VerifyOtpForm />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />
            <Route path="/reset-password" element={<ResetPasswordForm />} />
            <Route
                path="/chat"
                element={
                    <ProtectedRoute>
                        <ChatPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <SettingsPage />
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};
