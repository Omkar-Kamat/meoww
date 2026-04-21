import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
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

export default function ResetPassword() {
  const navigate = useNavigate();
  const show = useToastStore((s) => s.show);
  const { themeKey } = useTheme();

  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedPass, setFocusedPass] = useState(false);
  const [focusedConf, setFocusedConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordInvalid = password && !RULES.password.test(password);
  const confirmInvalid = confirm && password !== confirm;
  const confirmValid = confirm && password === confirm;

  const passBorder = passwordInvalid
    ? S.fieldErr
    : focusedPass || password
      ? S.fieldOk
      : S.fieldDim;
  const confBorder = confirmInvalid
    ? S.fieldErr
    : confirmValid
      ? S.fieldGood
      : focusedConf || confirm
        ? S.fieldOk
        : S.fieldDim;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!RULES.password.test(password)) {
      show(RULES.password.toast, "error");
      return;
    }
    if (password !== confirm) {
      show("Passwords do not match.", "error");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { userId, token, password });
      setSuccess(true);
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === "INVALID_RESET_TOKEN")
        show("This reset link has expired or already been used.", "error");
      else show(err.response?.data?.error || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!userId || !token) {
    return (
      <AuthShell>
        <AuthCard variants={fadeUp}>
          <AuthHeading
            eyebrow="Invalid link"
            title="Broken reset link"
            subtitle="This link is missing or malformed. Please request a fresh one."
          />
          <AccentButton
            onClick={() => navigate("/forgot-password")}
            themes={themes}
            themeKey={themeKey}
          >
            Request New Link →
          </AccentButton>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AnimatePresence mode="wait">
        {success ? (
          <AuthCard
            key="success"
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <AuthHeading
              eyebrow="All done"
              title="Password reset!"
              subtitle="Your password has been updated and all sessions signed out for security."
            />
            <AccentButton
              onClick={() => navigate("/login")}
              themes={themes}
              themeKey={themeKey}
            >
              Log In →
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
              eyebrow="New password"
              title="Reset your password"
              subtitle="Choose a strong password for your account."
            />

            <div className="flex flex-col gap-3">
              {/* Password */}
              <div className="flex flex-col">
                <div className="relative">
                  <input
                    className={`${S.field} ${passBorder} pr-11`}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                    type={showPassword ? "text" : "password"}
                    placeholder={RULES.password.hint}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedPass(true)}
                    onBlur={() => setFocusedPass(false)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {passwordInvalid && (
                  <span className={`${S.hint} ${S.hintErr}`}>
                    {RULES.password.message}
                  </span>
                )}
              </div>

              {/* Confirm */}
              <div className="flex flex-col">
                <input
                  className={`${S.field} ${confBorder}`}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onFocus={() => setFocusedConf(true)}
                  onBlur={() => setFocusedConf(false)}
                />
                {confirmInvalid && (
                  <span className={`${S.hint} ${S.hintErr}`}>
                    Passwords do not match.
                  </span>
                )}
                {confirmValid && (
                  <span className={`${S.hint} ${S.hintOk}`}>
                    Passwords match.
                  </span>
                )}
              </div>
            </div>

            <AccentButton
              disabled={loading || !!confirmInvalid || !confirm}
              type="submit"
              themes={themes}
              themeKey={themeKey}
            >
              {loading ? "Resetting…" : "Reset Password →"}
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
