import type { FormEvent } from "react";
import { useState } from "react";
import { AuthCard, AuthHeading, AuthShell } from "./AuthShell";
import { FieldRow } from "../../../shared/components/FieldRow";
import { authApi } from "../api/authApi";
import { useNavigate, useLocation } from "react-router-dom";
import { getErrorMessage } from "../../../shared/utils/error";
import { RULES } from "../../../shared/utils/ui.config";
import { Input } from "../../../shared/components/Input";
import { Button } from "../../../shared/components/Button";

export const ResetPasswordForm = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [matchError, setMatchError] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Assuming URL is /reset-password?userId=...&token=...
  const queryParams = new URLSearchParams(location.search);
  const userId = queryParams.get("userId") || "";
  const token = queryParams.get("token") || "";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMatchError("");
    setMsg("");
    if (password !== confirmPassword) {
      setMatchError("Passwords do not match");
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
      setError(getErrorMessage(err, "Failed to reset password"));
    }
  };

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading
          title="Reset Password"
          subtitle="Enter your new password"
        />
        <form onSubmit={handleSubmit}>
          <FieldRow label="New Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={RULES.PASSWORD_MIN_LENGTH}
            />
          </FieldRow>
          <FieldRow label="Confirm New Password" error={matchError}>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={RULES.PASSWORD_MIN_LENGTH}
            />
          </FieldRow>
          {error && (
            <div
              style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}
            >
              {error}
            </div>
          )}
          {msg && (
            <div
              style={{ color: "green", fontSize: "14px", marginBottom: "10px" }}
            >
              {msg}
            </div>
          )}
          <Button type="submit" fullWidth>
            Reset Password
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  );
};
