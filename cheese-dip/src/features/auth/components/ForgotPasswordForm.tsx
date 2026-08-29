import type { FormEvent } from "react";
import { useState } from "react";
import { AuthCard, AuthHeading, AuthShell } from "./AuthShell";
import { FieldRow } from "../../../shared/components/FieldRow";
import { authApi } from "../api/authApi";
import { Link as RouterLink } from "react-router-dom";
import { getErrorMessage } from "../../../shared/utils/error";
import { TextField, Button, Text, Link, Flex } from "@radix-ui/themes";
import { MorphIcon } from "morphicons/react";
import { Mail, Send, ArrowLeft } from "lucide";

export const ForgotPasswordForm = () => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [msg, setMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isHoveringSubmit, setIsHoveringSubmit] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setMsg("");
        setIsLoading(true);
        try {
            await authApi.forgotPassword({ email });
            setMsg("If an account with that email exists, a reset link has been sent.");
        } catch (err) {
            setError(getErrorMessage(err, "Failed to request password reset"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthShell>
            <AuthCard>
                <AuthHeading
                    title="Forgot Password"
                    subtitle="Enter your email to receive a reset link"
                />
                <form onSubmit={handleSubmit}>
                    <FieldRow label="Email" htmlFor="email" error={error}>
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
                    {msg && (
                        <Text
                            color="grass"
                            size="2"
                            style={{ display: "block", marginBottom: "15px" }}
                            aria-live="polite"
                        >
                            {msg}
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
                        Send Reset Link
                        <MorphIcon
                            icon={isHoveringSubmit ? Send : Mail}
                            size={18}
                            spring="snappy"
                        />
                    </Button>
                </form>
                <Flex direction="column" mt="5" align="center">
                    <Link asChild size="2">
                        <RouterLink to="/login">
                            <Flex align="center" gap="1">
                                <MorphIcon icon={ArrowLeft} size={14} />
                                Back to Login
                            </Flex>
                        </RouterLink>
                    </Link>
                </Flex>
            </AuthCard>
        </AuthShell>
    );
};
