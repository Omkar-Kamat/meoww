import type { FormEvent } from "react";
import { useState, useEffect } from "react";
import { AuthCard, AuthHeading, AuthShell } from "./AuthShell";
import { FieldRow } from "../../../shared/components/FieldRow";
import { authApi } from "../api/authApi";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate, useLocation } from "react-router-dom";
import { getErrorMessage } from "../../../shared/utils/error";
import { Input } from "../../../shared/components/Input";
import { Button } from "../../../shared/components/Button";

export const VerifyOtpForm = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const { fetchMe } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  useEffect(() => {
    if (!email) {
      navigate("/signup");
    }
  }, [email, navigate]);

  if (!email) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await authApi.verifyOtp({ identifier: email, code });
      await fetchMe();
      navigate("/chat");
    } catch (err) {
      setError(getErrorMessage(err, "Verification failed"));
    }
  };

  const handleResend = async () => {
    setError("");
    setMsg("");
    try {
      await authApi.resendOtp({ identifier: email });
      setMsg("OTP sent successfully");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to resend OTP"));
    }
  };

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading
          title="Verify Email"
          subtitle={`Enter the 6-digit code sent to ${email}`}
        />
        <form onSubmit={handleSubmit}>
          <FieldRow label="OTP Code" error={error}>
            <Input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              style={{
                textAlign: "center",
                letterSpacing: "5px",
                fontSize: "18px",
              }}
            />
          </FieldRow>
          {msg && (
            <div
              style={{ color: "green", fontSize: "12px", marginBottom: "10px" }}
            >
              {msg}
            </div>
          )}
          <Button type="submit" fullWidth>
            Verify
          </Button>
        </form>
        <div style={{ marginTop: "15px", textAlign: "center" }}>
          <Button
            onClick={handleResend}
            style={{
              background: "none",
              border: "none",
              color: "#007bff",
              cursor: "pointer",
              fontSize: "14px",
              textDecoration: "underline",
            }}
          >
            Resend Code
          </Button>
        </div>
      </AuthCard>
    </AuthShell>
  );
};
