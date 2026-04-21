import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import api from "../api/axios";
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
  S,
} from "../components/AuthShell";

export default function Signup() {
  const navigate = useNavigate();
  const show = useToastStore((s) => s.show);
  const { themeKey } = useTheme();

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [focused, setFocused] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!RULES.username.regex.test(form.username.trim())) {
      show(RULES.username.toast, "error");
      return;
    }
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
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("username", form.username.trim());
      fd.append("email", form.email.trim().toLowerCase());
      fd.append("password", form.password);
      if (file) fd.append("profilePhoto", file);
      const res = await api.post("/api/auth/signup", fd);
      show("Account created. Check your email for verification.", "success");
      navigate(`/verify?userId=${res.data.userId}`);
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === "EMAIL_EXISTS")
        show("Email already registered. Try logging in instead.", "error");
      else if (code === "USERNAME_EXISTS")
        show("Username already taken. Choose another one.", "error");
      else
        show(
          err.response?.data?.error || "Signup failed. Please try again.",
          "error",
        );
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
          eyebrow="New here"
          title="Create your account"
          subtitle="Join and start meeting someone new."
        />

        <div className="flex flex-col gap-3">
          {AUTH_FIELDS.signup.map(({ name, type, placeholder }) => {
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

          {/* File upload */}
          <label className="flex items-center gap-3 px-[18px] py-[11px] rounded-full border border-white/[0.09] bg-white/[0.04] cursor-pointer transition-colors hover:border-[rgba(0,229,255,0.35)]">
            {preview ? (
              <img
                src={preview}
                alt=""
                className="size-6 rounded-full object-cover shrink-0"
              />
            ) : (
              <Upload size={15} className="text-white/40 shrink-0" />
            )}
            <span
              className="text-[0.88rem] truncate"
              style={{
                color: preview ? "#fff" : "rgba(255,255,255,0.35)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {file ? file.name : "Profile photo (optional)"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFile}
            />
          </label>
        </div>

        <AccentButton
          disabled={loading}
          type="submit"
          themes={themes}
          themeKey={themeKey}
        >
          {loading ? "Creating account…" : "Sign Up →"}
        </AccentButton>

        <p
          className="text-center text-[0.82rem] text-white/45 mt-1"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Already have an account?{" "}
          <InlineLink onClick={() => navigate("/login")}>Log in</InlineLink>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
