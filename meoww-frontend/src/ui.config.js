/**
 * ui.config.js
 *
 * Single source of truth for all cross-cutting UI concerns:
 *   - Motion physics (framer-motion variants)
 *   - Validation rules (regex + messages)
 *   - Semantic style maps (status colours, toast variants)
 *
 * Components import what they need — nothing bleeds into logic files.
 */

/* ─── Motion physics ────────────────────────────────────────────────────── */

/** Standard ease curve used across the app. */
export const EASE = [0.22, 1, 0.36, 1];

/** Fade upward reveal. Apply to individual animated elements. */
export const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

/** Stagger parent — wrap a list of fadeUp children. */
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

/** Slide in from the right — used for chat sidebar. */
export const slideInRight = {
  initial: { width: 0, opacity: 0 },
  animate: { width: 300, opacity: 1 },
  exit: { width: 0, opacity: 0 },
  transition: { type: "spring", damping: 28, stiffness: 200 },
};

/** Generic fade in/out — used for overlays, banners. */
export const fadeInOut = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

/** Dropdown popover — scale + translate from origin. */
export const dropdownMotion = {
  initial: { opacity: 0, y: -8, scale: 0.93 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.93 },
  transition: { duration: 0.15 },
};

/** Toast slide in from right. */
export const toastMotion = {
  initial: { opacity: 0, x: 40, scale: 0.94 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 40, scale: 0.94 },
  transition: { duration: 0.22, ease: EASE },
};

/** Spring config for card hover lift. */
export const hoverLift = {
  whileHover: { y: -6 },
  transition: { type: "spring", stiffness: 200, damping: 22 },
};

/** Micro-tap for buttons. */
export const tap = { whileTap: { scale: 0.97 } };

/* ─── Validation ────────────────────────────────────────────────────────── */

export const RULES = {
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Enter a valid email address.",
    toast: "Please enter a valid email address.",
  },
  username: {
    regex: /^[a-zA-Z0-9_]+$/,
    message: "Only letters, numbers and _ allowed.",
    toast: "Username can only contain letters, numbers and underscores.",
  },
  password: {
    test: (v) => v.length >= 6 && v.length <= 12,
    message: "Password must be 6–12 characters.",
    toast: "Password must be between 6 and 12 characters.",
    hint: "Password (6–12 characters)",
  },
};

/**
 * Runs a named rule against a value.
 * Returns { valid: boolean, message?: string }
 */
export function validate(ruleName, value) {
  const rule = RULES[ruleName];
  if (!rule) return { valid: true };
  const valid = rule.regex ? rule.regex.test(value) : rule.test(value);
  return { valid, message: valid ? undefined : rule.message };
}

/* ─── Toast style map ───────────────────────────────────────────────────── */

export const TOAST_STYLES = {
  success: {
    background: "rgba(74, 222, 128, 0.08)",
    border: "1px solid rgba(74, 222, 128, 0.25)",
    color: "rgba(74, 222, 128, 0.95)",
  },
  error: {
    background: "rgba(255, 80, 80, 0.08)",
    border: "1px solid rgba(255, 80, 80, 0.25)",
    color: "rgba(255, 110, 110, 0.95)",
  },
  info: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.10)",
    color: "#fff",
  },
};

/* ─── Status colour map (chat page status pill) ─────────────────────────── */

export const STATUS_COLORS = {
  idle: "rgba(255, 255, 255, 0.35)",
  queued: "rgba(255, 200, 0, 0.8)",
  matched: "rgba(74, 222, 128, 0.9)",
};

/* ─── Grain background data URI (shared across page shells) ─────────────── */

export const GRAIN_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

/* ─── Auth field config — drives input rendering in auth pages ──────────── */

export const AUTH_FIELDS = {
  login: [
    { name: "email", type: "email", placeholder: "Email address" },
    { name: "password", type: "password", placeholder: RULES.password.hint },
  ],
  signup: [
    { name: "name", type: "text", placeholder: "Full name" },
    {
      name: "username",
      type: "text",
      placeholder: "Username (letters, numbers, _)",
    },
    { name: "email", type: "email", placeholder: "Email address" },
    { name: "password", type: "password", placeholder: RULES.password.hint },
  ],
};
