import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ThemeDropdown from "./ThemeDropdown";
import { useTheme } from "../theme/useTheme";
import { themes } from "../theme/themes";
import { stagger, fadeUp } from "../ui.config";

const S = {
  page: "min-h-screen bg-[#080808] flex items-center justify-center p-6 relative overflow-hidden",
  orbTop:
    "absolute w-[600px] h-[600px] rounded-full pointer-events-none blur-[110px] bg-[rgba(0,229,255,0.055)] -top-[180px] left-1/2 -translate-x-1/2",
  orbBot:
    "absolute w-[300px] h-[300px] rounded-full pointer-events-none blur-[110px] bg-[rgba(0,229,255,0.03)] -bottom-[60px] -right-[60px]",
  content: "w-full max-w-[420px] flex flex-col gap-7 relative z-10",
  brand: "text-center",
  brandTxt:
    "font-bold text-2xl text-white tracking-[-0.03em] cursor-pointer transition-opacity hover:opacity-70",

  /* Card */
  card: "bg-white/[0.04] border border-white/[0.09] backdrop-blur-xl rounded-2xl p-[clamp(28px,5vw,40px)] flex flex-col gap-5",

  /* Heading */
  eyebrow: "text-[0.65rem] tracking-[0.14em] uppercase mb-2",
  h2: "text-[1.6rem] font-bold text-white tracking-[-0.03em] leading-tight",
  subtitle: "mt-1.5 text-[0.85rem] text-white/50 leading-relaxed",

  /* Input */
  field:
    "w-full px-[18px] py-[11px] rounded-full border bg-white/[0.04] text-white text-[0.88rem] outline-none transition-all placeholder:text-white/35",
  fieldOk: "border-[var(--accent)]",
  fieldDim: "border-white/[0.09]",
  fieldErr: "border-red-500/70 bg-red-500/[0.05]",
  fieldGood: "border-green-400/60 bg-green-400/[0.04]",
  hint: "text-[0.72rem] pl-3.5 mt-1",
  hintErr: "text-red-400/85",
  hintOk: "text-green-400/85",

  /* Buttons */
  btnAccent:
    "w-full py-3 rounded-full border-none font-medium text-[0.92rem] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed",
  inlineLink: "cursor-pointer transition-opacity hover:opacity-70",

  /* Footer text */
  footer: "text-center text-[0.82rem] text-white/45 mt-1",
};

export { S };

export default function AuthShell({ children }) {
  const navigate = useNavigate();

  return (
    <div className={S.page}>
      <ThemeDropdown />
      <div className={S.orbTop} />
      <div className={S.orbBot} />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className={S.content}
      >
        <motion.div variants={fadeUp} className={S.brand}>
          <span
            className={S.brandTxt}
            style={{ fontFamily: "'Syne', sans-serif" }}
            onClick={() => navigate("/")}
          >
            Meoww
          </span>
        </motion.div>
        {children}
      </motion.div>
    </div>
  );
}

export function AuthCard({
  children,
  as: Tag = motion.div,
  className = "",
  ...props
}) {
  return (
    <Tag {...props} className={`${S.card} ${className}`}>
      {children}
    </Tag>
  );
}

export function AuthHeading({ eyebrow, title, subtitle }) {
  return (
    <div>
      {eyebrow && (
        <div
          className={S.eyebrow}
          style={{
            color: "var(--accent)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {eyebrow}
        </div>
      )}
      <h2 className={S.h2} style={{ fontFamily: "'Syne', sans-serif" }}>
        {title}
      </h2>
      {subtitle && (
        <p
          className={S.subtitle}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function AccentButton({
  children,
  disabled,
  themes: t,
  themeKey,
  ...props
}) {
  const textColor = t?.[themeKey]?.colors?.bg1 ?? "#000";
  return (
    <motion.button
      whileHover={
        !disabled
          ? { scale: 1.02, boxShadow: "0 0 32px rgba(0,229,255,0.35)" }
          : {}
      }
      whileTap={!disabled ? { scale: 0.98 } : {}}
      disabled={disabled}
      className={S.btnAccent}
      style={{
        background: "var(--accent)",
        color: textColor,
        fontFamily: "'DM Sans', sans-serif",
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function InlineLink({ children, onClick }) {
  return (
    <span
      className={S.inlineLink}
      style={{ color: "var(--accent)", fontFamily: "'DM Sans', sans-serif" }}
      onClick={onClick}
    >
      {children}
    </span>
  );
}

export function FieldRow({
  name,
  type,
  placeholder,
  value,
  onChange,
  focused,
  setFocused,
  error,
  hint,
}) {
  const isFilled = value && !error;
  const borderCls = error
    ? S.fieldErr
    : focused === name || isFilled
      ? S.fieldOk
      : S.fieldDim;

  return (
    <div className="flex flex-col">
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(name)}
        onBlur={() => setFocused("")}
        className={`${S.field} ${borderCls}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      />
      {error && <span className={`${S.hint} ${S.hintErr}`}>{hint}</span>}
    </div>
  );
}
