import React, { useState } from "react";
import { AuthCard, AuthHeading, AuthShell, FieldRow } from "./AuthShell";
import { authApi } from "../api/authApi";
import { useNavigate, useLocation } from "react-router-dom";

export const ResetPasswordForm = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Assuming URL is /reset-password?userId=...&token=...
  const queryParams = new URLSearchParams(location.search);
  const userId = queryParams.get("userId") || "";
  const token = queryParams.get("token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!userId || !token) {
      setError("Invalid or missing reset token");
      return;
    }

    try {
      await authApi.resetPassword({ userId, token, password });
      setMsg("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading title="Reset Password" subtitle="Enter your new password" />
        <form onSubmit={handleSubmit}>
          <FieldRow label="New Password">
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} 
            />
          </FieldRow>
          <FieldRow label="Confirm New Password" error={error}>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} 
            />
          </FieldRow>
          {msg && <div style={{ color: "green", fontSize: "14px", marginBottom: "10px" }}>{msg}</div>}
          <button type="submit" style={{ width: "100%", padding: "10px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", marginTop: "10px" }}>
            Reset Password
          </button>
        </form>
      </AuthCard>
    </AuthShell>
  );
};
