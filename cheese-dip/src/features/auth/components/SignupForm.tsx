import React, { useState } from "react";
import { AuthCard, AuthHeading, AuthShell, FieldRow } from "./AuthShell";
import { authApi } from "../api/authApi";
import { useNavigate, Link } from "react-router-dom";

export const SignupForm = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("username", username);
      formData.append("email", email);
      formData.append("password", password);
      if (profilePhoto) {
        formData.append("profilePhoto", profilePhoto);
      }

      await authApi.signup(formData);
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Signup failed");
    }
  };

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading title="Create an Account" />
        <form onSubmit={handleSubmit}>
          <FieldRow label="Name">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} />
          </FieldRow>
          <FieldRow label="Username">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} />
          </FieldRow>
          <FieldRow label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} />
          </FieldRow>
          <FieldRow label="Password">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} />
          </FieldRow>
          <FieldRow label="Profile Photo (Optional)" error={error}>
            <input type="file" onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)} style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} accept="image/*" />
          </FieldRow>
          <button type="submit" style={{ width: "100%", padding: "10px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", marginTop: "10px" }}>
            Sign Up
          </button>
        </form>
        <div style={{ marginTop: "15px", textAlign: "center" }}>
          <Link to="/login" style={{ fontSize: "14px", color: "#007bff" }}>Already have an account? Login</Link>
        </div>
      </AuthCard>
    </AuthShell>
  );
};
