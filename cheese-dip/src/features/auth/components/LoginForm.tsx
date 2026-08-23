import type { FormEvent } from "react";
import { useState } from "react";
import { AuthCard, AuthHeading, AuthShell } from "./AuthShell";
import { FieldRow } from "../../../shared/components/FieldRow";
import { authApi } from "../api/authApi";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { getApiError } from "../../../shared/utils/error";
import { TextField, Button, Text, Link, Flex } from "@radix-ui/themes";
import { MorphIcon } from "morphicons/react";
import { Mail, Lock, LogIn, ArrowRight } from "lucide";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isHoveringSubmit, setIsHoveringSubmit] = useState(false);
  const { fetchMe } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
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
          <FieldRow label="Email">
            <TextField.Root
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
          
          <FieldRow label="Password">
            <TextField.Root
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={100}
              size="3"
            >
              <TextField.Slot>
                <MorphIcon icon={Lock} size={16} color="var(--gray-a11)" />
              </TextField.Slot>
            </TextField.Root>
          </FieldRow>
          
          {error && (
            <Text color="ruby" size="2" style={{ display: "block", marginBottom: "15px" }}>
              {error}
            </Text>
          )}
          
          <Button 
            type="submit" 
            size="3" 
            style={{ width: "100%", marginTop: "10px", cursor: "pointer" }}
            onMouseEnter={() => setIsHoveringSubmit(true)}
            onMouseLeave={() => setIsHoveringSubmit(false)}
          >
            Login
            <MorphIcon 
              icon={isHoveringSubmit ? ArrowRight : LogIn} 
              size={18} 
              spring="snappy"
            />
          </Button>
        </form>
        
        <Flex direction="column" gap="3" mt="5" align="center">
          <Link asChild size="2">
            <RouterLink to="/forgot-password">
              Forgot Password?
            </RouterLink>
          </Link>
          <Text size="2" color="gray">
            Don't have an account?{" "}
            <Link asChild>
              <RouterLink to="/signup">
                Sign up
              </RouterLink>
            </Link>
          </Text>
        </Flex>
      </AuthCard>
    </AuthShell>
  );
};
