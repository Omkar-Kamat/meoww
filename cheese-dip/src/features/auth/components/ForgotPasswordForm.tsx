import type { FormEvent } from "react";
import { useState } from "react";
import { AuthCard, AuthHeading, AuthShell } from "./AuthShell";
import { FieldRow } from "../../../shared/components/FieldRow";
import { authApi } from "../api/authApi";
import { Link } from "react-router-dom";
import { getErrorMessage } from "../../../shared/utils/error";
import { Input } from "../../../shared/components/Input";
import { Button } from "../../../shared/components/Button";

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await authApi.forgotPassword({ email });
      setMsg(
        "If an account with that email exists, a reset link has been sent.",
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to request password reset"));
    }
  };

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading
          title="Forgot Password"
          subtitle="Enter your email to receive a reset link"
        />
        <form onSubmit={handleSubmit}>
          <FieldRow label="Email" error={error}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FieldRow>
          {msg && (
            <div
              style={{ color: "green", fontSize: "14px", marginBottom: "10px" }}
            >
              {msg}
            </div>
          )}
          <Button type="submit" fullWidth>
            Send Reset Link
          </Button>
        </form>
        <div style={{ marginTop: "15px", textAlign: "center" }}>
          <Link to="/login" style={{ fontSize: "14px", color: "#007bff" }}>
            Back to Login
          </Link>
        </div>
      </AuthCard>
    </AuthShell>
  );
};
