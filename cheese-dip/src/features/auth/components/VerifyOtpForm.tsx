import type { FormEvent } from "react";
import { useState, useEffect } from "react";
import { AuthCard, AuthHeading, AuthShell } from "./AuthShell";
import { FieldRow } from "../../../shared/components/FieldRow";
import { authApi } from "../api/authApi";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate, useLocation } from "react-router-dom";
import { getErrorMessage } from "../../../shared/utils/error";
import { TextField, Button, Text, Flex } from "@radix-ui/themes";
import { MorphIcon } from "morphicons/react";
import { KeyRound, RefreshCw, CheckCircle2 } from "lucide";

export const VerifyOtpForm = () => {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [msg, setMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [isHoveringSubmit, setIsHoveringSubmit] = useState(false);
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
        setIsLoading(true);
        try {
            await authApi.verifyOtp({ identifier: email, code });
            await fetchMe();
            navigate("/chat");
        } catch (err) {
            setError(getErrorMessage(err, "Verification failed"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setError("");
        setMsg("");
        setIsResending(true);
        try {
            await authApi.resendOtp({ identifier: email });
            setMsg("OTP sent successfully");
        } catch (err) {
            setError(getErrorMessage(err, "Failed to resend OTP"));
        } finally {
            setIsResending(false);
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
                    <FieldRow label="OTP Code" htmlFor="code" error={error}>
                        <TextField.Root
                            id="code"
                            name="code"
                            autoComplete="one-time-code"
                            type="text"
                            minLength={6}
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                            size="3"
                            style={{
                                textAlign: "center",
                                letterSpacing: "5px",
                                fontSize: "18px",
                            }}
                        >
                            <TextField.Slot>
                                <MorphIcon icon={KeyRound} size={16} color="var(--gray-a11)" />
                            </TextField.Slot>
                        </TextField.Root>
                    </FieldRow>
                    {msg && (
                        <Text
                            color="grass"
                            size="2"
                            style={{ display: "block", marginBottom: "10px" }}
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
                        Verify
                        <MorphIcon
                            icon={isHoveringSubmit ? CheckCircle2 : KeyRound}
                            size={18}
                            spring="snappy"
                        />
                    </Button>
                </form>
                <Flex direction="column" mt="5" align="center">
                    <Button
                        variant="ghost"
                        onClick={handleResend}
                        disabled={isResending}
                        loading={isResending}
                        style={{ cursor: "pointer" }}
                    >
                        Resend Code
                        <MorphIcon icon={RefreshCw} size={16} />
                    </Button>
                </Flex>
            </AuthCard>
        </AuthShell>
    );
};
