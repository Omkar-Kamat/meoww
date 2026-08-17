import React, { useState } from "react";
import { AuthCard, AuthHeading, AuthShell, FieldRow } from "./AuthShell";
import { authApi } from "../api/authApi";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate, useLocation } from "react-router-dom";

export const VerifyOtpForm = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const { fetchMe } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  React.useEffect(() => {
    if (!email) {
      navigate("/signup");
    }
  }, [email, navigate]);

  if (!email) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await authApi.verifyOtp({ identifier: email, code });
      await fetchMe();
      navigate("/chat");
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Verification failed");
    }
  };

  const handleResend = async () => {
    setError("");
    setMsg("");
    try {
      await authApi.resendOtp({ identifier: email });
      setMsg("OTP sent successfully");
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading title="Verify Email" subtitle={`Enter the 6-digit code sent to ${email}`} />
        <form onSubmit={handleSubmit}>
          <FieldRow label="OTP Code" error={error}>
            <input 
              type="text" 
              maxLength={6}
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              required 
              style={{ width: "100%", padding: "8px", boxSizing: "border-box", textAlign: "center", letterSpacing: "5px", fontSize: "18px" }} 
            />
          </FieldRow>
          {msg && <div style={{ color: "green", fontSize: "12px", marginBottom: "10px" }}>{msg}</div>}
          <button type="submit" style={{ width: "100%", padding: "10px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", marginTop: "10px" }}>
            Verify
          </button>
        </form>
        <div style={{ marginTop: "15px", textAlign: "center" }}>
          <button onClick={handleResend} style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", fontSize: "14px", textDecoration: "underline" }}>
            Resend Code
          </button>
        </div>
      </AuthCard>
    </AuthShell>
  );
};
