import type { FormEvent } from "react";
import { useState } from "react";
import { AuthCard, AuthHeading, AuthShell } from "./AuthShell";
import { FieldRow } from "../../../shared/components/FieldRow";
import { authApi } from "../api/authApi";
import { useNavigate, Link } from "react-router-dom";
import { getApiError } from "../../../shared/utils/error";
import { RULES } from "../../../shared/utils/ui.config";
import { Input } from "../../../shared/components/Input";
import { Button } from "../../../shared/components/Button";

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setUsernameError("");
    setEmailError("");

    // keep in sync with auth.schema.ts
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
      } else if (apiErr?.meta?.errors) {
        apiErr.meta.errors.forEach((e) => {
          if (e.path.includes("username")) setUsernameError(e.message);
          if (e.path.includes("email")) setEmailError(e.message);
        });
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
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={50}
            />
          </FieldRow>
          <FieldRow label="Username" error={usernameError}>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={RULES.USERNAME_MIN_LENGTH}
              maxLength={RULES.USERNAME_MAX_LENGTH}
              pattern="^[a-z0-9_]+$"
              title="Lowercase letters, numbers, and underscores only"
            />
          </FieldRow>
          <FieldRow label="Email" error={emailError}>
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
              minLength={RULES.PASSWORD_MIN_LENGTH}
              maxLength={100}
            />
          </FieldRow>
          {error && (
            <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
          )}
          <FieldRow label="Profile Photo (Optional)">
            <Input
              type="file"
              onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
              accept="image/*"
            />
          </FieldRow>
          <Button
            type="submit"
            fullWidth
            style={{ backgroundColor: "#28a745" }}
          >
            Sign Up
          </Button>
        </form>
        <div style={{ marginTop: "15px", textAlign: "center" }}>
          <Link to="/login" style={{ fontSize: "14px", color: "#007bff" }}>
            Already have an account? Login
          </Link>
        </div>
      </AuthCard>
    </AuthShell>
  );
};
