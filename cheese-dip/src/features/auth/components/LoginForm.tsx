import React, { useState } from "react";
import { AuthCard, AuthHeading, AuthShell, FieldRow } from "./AuthShell";
import { authApi } from "../api/authApi";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate, Link } from "react-router-dom";

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
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Login failed");
    }
  };

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading title="Welcome Back" subtitle="Login to your account" />
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
          <FieldRow label="Password">
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} 
            />
          </FieldRow>
          <button type="submit" style={{ width: "100%", padding: "10px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", marginTop: "10px" }}>
            Login
          </button>
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
