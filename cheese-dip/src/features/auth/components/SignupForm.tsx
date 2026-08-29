import type { FormEvent } from "react";
import { useState } from "react";
import { AuthCard, AuthHeading, AuthShell } from "./AuthShell";
import { FieldRow } from "../../../shared/components/FieldRow";
import { authApi } from "../api/authApi";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { getApiError } from "../../../shared/utils/error";
import { RULES } from "../../../shared/utils/ui.config";
import { TextField, Button, Text, Link, Flex, Avatar } from "@radix-ui/themes";
import { MorphIcon } from "morphicons/react";
import { Mail, Lock, User, AtSign, UserPlus, Sparkles, Upload } from "lucide";

export const SignupForm = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHoveringSubmit, setIsHoveringSubmit] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
    
    if (profilePhoto && profilePhoto.size > RULES.MAX_AVATAR_SIZE_BYTES) {
      setError("Profile photo must be smaller than 5MB");
      return;
    }

    setIsLoading(true);
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
      } else if (apiErr?.meta?.issues) {
        apiErr.meta.issues.forEach((issue) => {
          if (issue.path === "username") setUsernameError(issue.message);
          if (issue.path === "email") setEmailError(issue.message);
        });
      } else {
        setError(apiErr?.message || "Signup failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading title="Create an Account" />
        <form onSubmit={handleSubmit}>
          <FieldRow label="Name" htmlFor="name">
            <TextField.Root
              id="name"
              name="name"
              autoComplete="name"
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={50}
              size="3"
            >
              <TextField.Slot>
                <MorphIcon icon={User} size={16} color="var(--gray-a11)" />
              </TextField.Slot>
            </TextField.Root>
          </FieldRow>

          <FieldRow label="Username" htmlFor="username" error={usernameError}>
            <TextField.Root
              id="username"
              name="username"
              autoComplete="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={RULES.USERNAME_MIN_LENGTH}
              maxLength={RULES.USERNAME_MAX_LENGTH}
              pattern="^[a-z0-9_]+$"
              title="Lowercase letters, numbers, and underscores only"
              size="3"
            >
              <TextField.Slot>
                <MorphIcon icon={AtSign} size={16} color="var(--gray-a11)" />
              </TextField.Slot>
            </TextField.Root>
          </FieldRow>

          <FieldRow label="Email" htmlFor="email" error={emailError}>
            <TextField.Root
              id="email"
              name="email"
              autoComplete="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              size="3"
            >
              <TextField.Slot>
                <MorphIcon icon={Mail} size={16} color="var(--gray-a11)" />
              </TextField.Slot>
            </TextField.Root>
          </FieldRow>

          <FieldRow label="Password" htmlFor="password">
            <TextField.Root
              id="password"
              name="password"
              autoComplete="new-password"
              type="password"
              placeholder="Choose a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={RULES.PASSWORD_MIN_LENGTH}
              maxLength={100}
              size="3"
            >
              <TextField.Slot>
                <MorphIcon icon={Lock} size={16} color="var(--gray-a11)" />
              </TextField.Slot>
            </TextField.Root>
          </FieldRow>

          <FieldRow label="Profile Photo (Optional)" htmlFor="profilePhoto">
            <Flex align="center" gap="4">
              <input
                id="profilePhoto"
                name="profilePhoto"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setProfilePhoto(file);
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(file ? URL.createObjectURL(file) : null);
                }}
                accept="image/*"
                style={{ display: "none" }}
              />
              <Avatar
                size="5"
                src={previewUrl || undefined}
                fallback={<MorphIcon icon={User} size={24} color="var(--gray-11)" />}
                radius="full"
                style={{ 
                  boxShadow: "0 2px 10px var(--black-a3)",
                  border: "1px solid var(--gray-a4)"
                }}
              />
              <Flex direction="column" gap="1">
                <Button 
                  type="button" 
                  variant="soft" 
                  size="2" 
                  color="gray"
                  onClick={() => document.getElementById('profilePhoto')?.click()}
                  style={{ cursor: "pointer" }}
                >
                  <MorphIcon icon={Upload} size={14} />
                  {profilePhoto ? "Change Photo" : "Upload Photo"}
                </Button>
                {profilePhoto && (
                  <Text size="1" color="ruby" style={{ cursor: "pointer", paddingLeft: "4px" }} onClick={() => {
                    setProfilePhoto(null);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }
                  }}>
                    Remove
                  </Text>
                )}
              </Flex>
            </Flex>
          </FieldRow>

          {error && (
            <Text color="ruby" size="2" style={{ display: "block", marginBottom: "15px" }} aria-live="polite">
              {error}
            </Text>
          )}

          <Button 
            type="submit" 
            size="3"
            loading={isLoading}
            style={{ width: "100%", marginTop: "10px", cursor: "pointer" }}
            onMouseEnter={() => setIsHoveringSubmit(true)}
            onMouseLeave={() => setIsHoveringSubmit(false)}
          >
            Sign Up
            <MorphIcon 
              icon={isHoveringSubmit ? Sparkles : UserPlus} 
              size={18} 
              spring="bouncy"
            />
          </Button>
        </form>
        
        <Flex direction="column" mt="5" align="center">
          <Text size="2" color="gray">
            Already have an account?{" "}
            <Link asChild>
              <RouterLink to="/login">
                Login
              </RouterLink>
            </Link>
          </Text>
        </Flex>
      </AuthCard>
    </AuthShell>
  );
};
