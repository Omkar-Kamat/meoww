import React, { useState } from "react";
import { AuthCard, AuthHeading, AuthShell, FieldRow } from "./AuthShell";
import { authApi } from "../api/authApi";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate, Link } from "react-router-dom";
import { getApiError } from "../../../shared/utils/error";
import { Input } from "../../../shared/components/Input";
import { Button } from "../../../shared/components/Button";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { fetchMe } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await authApi.login({ email, password });
      await fetchMe();
      navigate("/chat");
    } catch (err) {
      const apiErr = getApiError(err);
      if (apiErr?.code === "EMAIL_NOT_VERIFIED") {
        navigate("/verify-otp", { state: { email } });
        return;
      }
      setError(apiErr?.message || "Login failed");
    }
  };

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading title="Welcome Back" subtitle="Login to your account" />
        <form onSubmit={handleSubmit}>
          <FieldRow label="Email" error={error}>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
               
            />
          </FieldRow>
          <FieldRow label="Password">
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
               
            />
          </FieldRow>
          <Button type="submit" fullWidth>
            Login
          </Button>
        </form>
        <div style={{ marginTop: "15px", textAlign: "center" }}>
          <Link to="/forgot-password" style={{ fontSize: "14px", color: "#007bff" }}>Forgot Password?</Link>
        </div>
        <div style={{ marginTop: "10px", textAlign: "center" }}>
          <Link to="/signup" style={{ fontSize: "14px", color: "#007bff" }}>Don't have an account? Sign up</Link>
        </div>
      </AuthCard>
    </AuthShell>
  );
};
