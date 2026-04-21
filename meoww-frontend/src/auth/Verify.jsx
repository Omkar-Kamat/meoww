import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import { useTheme } from "../theme/useTheme";
import { themes } from "../theme/themes";
import { fadeUp } from "../ui.config";
import AuthShell, {
  AuthCard,
  AuthHeading,
  AccentButton,
  InlineLink,
  S,
} from "../components/AuthShell";

export default function Verify() {
  const navigate = useNavigate();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const show = useToastStore((s) => s.show);
  const { themeKey } = useTheme();

  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");

  const [otp, setOtp] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const borderCls = focused || otp ? S.fieldOk : S.fieldDim;

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/auth/verify", { userId, otp });
      await fetchMe();
      navigate("/chat");
    } catch (err) {
      show(err.response?.data?.error || "Invalid OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post("/api/auth/resend-otp", { userId });
      show("OTP resent successfully", "success");
    } catch (err) {
      show(err.response?.data?.error || "Failed to resend OTP", "error");
    }
  };

  return (
    <AuthShell>
      <AuthCard
        as={motion.form}
        variants={fadeUp}
        onSubmit={handleVerify}
        noValidate
      >
        <AuthHeading
          eyebrow="Almost there"
          title="Verify your email"
          subtitle="Enter the 6-digit code sent to your email."
        />

        <input
          className={`${S.field} ${borderCls} text-center text-[1.1rem] tracking-[0.35em]`}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
          placeholder="• • • • • •"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        <AccentButton
          disabled={loading}
          type="submit"
          themes={themes}
          themeKey={themeKey}
        >
          {loading ? "Verifying…" : "Verify →"}
        </AccentButton>

        <p
          className="text-center text-[0.82rem] text-white/45 mt-1"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Didn&apos;t receive a code?{" "}
          <InlineLink onClick={handleResend}>Resend</InlineLink>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
