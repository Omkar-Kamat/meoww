import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import { useTheme } from "../theme/useTheme";
import { themes } from "../theme/themes";
import { fadeUp, RULES, validate, AUTH_FIELDS } from "../ui.config";
import AuthShell, {
  AuthCard,
  AuthHeading,
  AccentButton,
  InlineLink,
  FieldRow,
} from "../components/AuthShell";

export default function Login() {
  const navigate = useNavigate();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const show = useToastStore((s) => s.show);
  const { themeKey } = useTheme();

  const [form, setForm] = useState({ email: "", password: "" });
  const [focused, setFocused] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!RULES.email.regex.test(form.email.trim())) {
      show(RULES.email.toast, "error");
      return;
    }
    if (!RULES.password.test(form.password)) {
      show(RULES.password.toast, "error");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/login", form);
      await fetchMe();
      navigate("/chat");
    } catch (err) {
      if (err.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        navigate(`/verify?userId=${err.response.data.userId}`);
        return;
      }
      show(err.response?.data?.error || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard
        as={motion.form}
        variants={fadeUp}
        onSubmit={handleSubmit}
        noValidate
      >
        <AuthHeading
          eyebrow="Welcome back"
          title="Log in to Meoww"
          subtitle="Pick up where you left off."
        />

        <div className="flex flex-col gap-3">
          {AUTH_FIELDS.login.map(({ name, type, placeholder }) => {
            const { valid, message } = form[name]
              ? validate(name, form[name])
              : { valid: true };
            return (
              <FieldRow
                key={name}
                name={name}
                type={type}
                placeholder={placeholder}
                value={form[name]}
                onChange={onChange}
                focused={focused}
                setFocused={setFocused}
                error={!valid}
                hint={message}
              />
            );
          })}
        </div>

        <div className="text-right -mt-1">
          <span
            onClick={() => navigate("/forgot-password")}
            className="text-[0.75rem] opacity-70 hover:opacity-100 cursor-pointer transition-opacity"
            style={{
              color: "var(--accent)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Forgot password?
          </span>
        </div>

        <AccentButton
          disabled={loading}
          type="submit"
          themes={themes}
          themeKey={themeKey}
        >
          {loading ? "Logging in…" : "Log In →"}
        </AccentButton>

        <p
          className="text-center text-[0.82rem] text-white/45 mt-1"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Don&apos;t have an account?{" "}
          <InlineLink onClick={() => navigate("/signup")}>Sign up</InlineLink>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
