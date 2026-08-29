import type { FormEvent } from "react";
import { useState } from "react";
import { AuthCard, AuthHeading, AuthShell } from "./AuthShell";
import { FieldRow } from "../../../shared/components/FieldRow";
import { authApi } from "../api/authApi";
import { useNavigate, useLocation } from "react-router-dom";
import { getErrorMessage } from "../../../shared/utils/error";
import { RULES } from "../../../shared/utils/ui.config";
import { TextField, Button, Text } from "@radix-ui/themes";
import { MorphIcon } from "morphicons/react";
import { Lock, CheckCircle2 } from "lucide";

export const ResetPasswordForm = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [matchError, setMatchError] = useState("");
    const [msg, setMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isHoveringSubmit, setIsHoveringSubmit] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const userId = queryParams.get("userId") || "";
    const token = queryParams.get("token") || "";

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setMatchError("");
        setMsg("");
        if (password !== confirmPassword) {
            setMatchError("Passwords do not match");
            return;
        }
        if (!userId || !token) {
            setError("Invalid or missing reset token");
            return;
        }

        if (userId.length !== 24 || !/^[0-9a-f]+$/.test(userId)) {
            setError("Invalid user ID");
            return;
        }

        if (token.length !== 64 || !/^[a-f0-9]+$/.test(token)) {
            setError("Invalid reset token");
            return;
        }

        try {
            setIsLoading(true);
            await authApi.resetPassword({ userId, token, password });
            setMsg("Password reset successful. Redirecting to login...");
            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            setError(getErrorMessage(err, "Failed to reset password"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthShell>
            <AuthCard>
                <AuthHeading title="Reset Password" subtitle="Enter your new password" />
                <form onSubmit={handleSubmit}>
                    <FieldRow label="New Password" htmlFor="password">
                        <TextField.Root
                            id="password"
                            name="password"
                            autoComplete="new-password"
                            type="password"
                            placeholder="Enter new password"
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
                    <FieldRow
                        label="Confirm New Password"
                        htmlFor="confirmPassword"
                        error={matchError}
                    >
                        <TextField.Root
                            id="confirmPassword"
                            name="confirmPassword"
                            autoComplete="new-password"
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {error && (
                        <Text
                            color="ruby"
                            size="2"
                            style={{ display: "block", marginBottom: "15px" }}
                            aria-live="polite"
                        >
                            {error}
                        </Text>
                    )}
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
                        Reset Password
                        <MorphIcon
                            icon={isHoveringSubmit ? CheckCircle2 : Lock}
                            size={18}
                            spring="snappy"
                        />
                    </Button>
                </form>
            </AuthCard>
        </AuthShell>
    );
};
