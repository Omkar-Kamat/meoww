import React, { useState } from "react";
import { AuthCard, AuthHeading, AuthShell, FieldRow } from "./AuthShell";
import { authApi } from "../api/authApi";
import { useNavigate, Link } from "react-router-dom";
import { getApiError } from "../../../shared/utils/error";
import { RULES } from "../../../shared/utils/ui.config";

export const SignupForm = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUsernameError("");
    setEmailError("");

    const reservedWords = ["admin", "meoww", "support", "test"];
    if (reservedWords.includes(username.toLowerCase())) {
      setUsernameError("Username is reserved");
      return;
    }
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
      const apiErr = getApiError(err);
      if (apiErr?.code === "USERNAME_EXISTS") {
        setUsernameError(apiErr.message);
      } else if (apiErr?.code === "EMAIL_EXISTS") {
        setEmailError(apiErr.message);
      } else {
        setError(apiErr?.message || "Signup failed");
      }
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
          <FieldRow label="Username" error={usernameError}>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={RULES.USERNAME_MIN_LENGTH} maxLength={RULES.USERNAME_MAX_LENGTH} pattern="[a-z0-9_]+" title="Lowercase letters, numbers, and underscores only" style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} />
          </FieldRow>
          <FieldRow label="Email" error={emailError}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} />
          </FieldRow>
          <FieldRow label="Password">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={RULES.PASSWORD_MIN_LENGTH} style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} />
          </FieldRow>
          {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
          <FieldRow label="Profile Photo (Optional)">
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
