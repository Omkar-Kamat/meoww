import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import { useToastStore } from "../store/useToastStore";
import { useTheme } from "../theme/useTheme";
import { themes } from "../theme/themes";
import { fadeUp, RULES } from "../ui.config";
import AuthShell, {
  AuthCard,
  AuthHeading,
  AccentButton,
  InlineLink,
  S,
} from "../components/AuthShell";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const show = useToastStore((s) => s.show);
  const { themeKey } = useTheme();

  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailInvalid = email && !RULES.email.regex.test(email.trim());
  const borderCls = emailInvalid
    ? S.fieldErr
    : focused || email
      ? S.fieldOk
      : S.fieldDim;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!RULES.email.regex.test(email.trim())) {
      show(RULES.email.toast, "error");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (err) {
      if (err.response?.status === 429)
        show("Too many requests. Please wait before trying again.", "error");
      else show(err.response?.data?.error || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <AnimatePresence mode="wait">
        {submitted ? (
          <AuthCard
            key="success"
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <AuthHeading
              eyebrow="Email sent"
              title="Check your inbox"
              subtitle={
                <>
                  If an account with <span className="text-white">{email}</span>{" "}
                  exists, we&apos;ve sent a reset link. It expires in 15
                  minutes.
                </>
              }
            />
            <AccentButton
              onClick={() => navigate("/login")}
              themes={themes}
              themeKey={themeKey}
            >
              Back to Login →
            </AccentButton>
          </AuthCard>
        ) : (
          <AuthCard
            key="form"
            as={motion.form}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            onSubmit={handleSubmit}
            noValidate
          >
            <AuthHeading
              eyebrow="Account recovery"
              title="Reset your password"
              subtitle="Enter your email and we'll send you a reset link."
            />

            <div className="flex flex-col">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className={`${S.field} ${borderCls}`}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />
              {emailInvalid && (
                <span className={`${S.hint} ${S.hintErr}`}>
                  {RULES.email.message}
                </span>
              )}
            </div>

            <AccentButton
              disabled={loading}
              type="submit"
              themes={themes}
              themeKey={themeKey}
            >
              {loading ? "Sending…" : "Send Reset Link →"}
            </AccentButton>

            <p
              className="text-center text-[0.82rem] text-white/45 mt-1"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Remember your password?{" "}
              <InlineLink onClick={() => navigate("/login")}>Log in</InlineLink>
            </p>
          </AuthCard>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
