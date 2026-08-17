import React, { useState } from "react";
import { AuthCard, AuthHeading, AuthShell, FieldRow } from "./AuthShell";
import { authApi } from "../api/authApi";
import { Link } from "react-router-dom";
import { getErrorMessage } from "../../../shared/utils/error";

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await authApi.forgotPassword({ email });
      setMsg("If an account with that email exists, a reset link has been sent.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to request password reset"));
    }
  };

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading title="Forgot Password" subtitle="Enter your email to receive a reset link" />
        <form onSubmit={handleSubmit}>
          <FieldRow label="Email" error={error}>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} 
            />
          </FieldRow>
          {msg && <div style={{ color: "green", fontSize: "14px", marginBottom: "10px" }}>{msg}</div>}
          <button type="submit" style={{ width: "100%", padding: "10px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", marginTop: "10px" }}>
            Send Reset Link
          </button>
        </form>
        <div style={{ marginTop: "15px", textAlign: "center" }}>
          <Link to="/login" style={{ fontSize: "14px", color: "#007bff" }}>Back to Login</Link>
        </div>
      </AuthCard>
    </AuthShell>
  );
};
