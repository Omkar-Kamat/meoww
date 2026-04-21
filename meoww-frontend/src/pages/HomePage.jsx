import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Palette,
  MousePointerClick,
  Shuffle,
  MessageSquareHeart,
  ArrowRight,
  Gamepad2,
  Music2,
  MessageCircle,
  BookOpen,
  Paintbrush,
  Moon,
  Dumbbell,
  Plane,
  Clapperboard,
  Laugh,
} from "lucide-react";
import { useTheme } from "../theme/useTheme";
import { themes } from "../theme/themes";
import { useState, useRef, useEffect } from "react";

/* ─── Variants ──────────────────────────────────────────────────────────── */
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ─── Interests ─────────────────────────────────────────────────────────── */
const INTERESTS = [
  { icon: <Gamepad2 size={13} />, label: "Gaming" },
  { icon: <Music2 size={13} />, label: "Music" },
  { icon: <MessageCircle size={13} />, label: "Just Talk" },
  { icon: <BookOpen size={13} />, label: "Study" },
  { icon: <Paintbrush size={13} />, label: "Creative" },
  { icon: <Moon size={13} />, label: "Night Owl" },
  { icon: <Dumbbell size={13} />, label: "Fitness" },
  { icon: <Plane size={13} />, label: "Travel" },
  { icon: <Clapperboard size={13} />, label: "Movies" },
  { icon: <Laugh size={13} />, label: "Memes" },
];

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const { themeKey, setThemeKey } = useTheme();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const dropRef = useRef();

  useEffect(() => {
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = (label) =>
    setSelected((p) =>
      p.includes(label)
        ? p.filter((l) => l !== label)
        : p.length >= 3
          ? p
          : [...p, label],
    );

  return (
    <div
      className="grain"
      style={{
        minHeight: "100vh",
        background: "var(--page-bg)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Orbs */}
      <div
        className="orb"
        style={{
          width: 700,
          height: 700,
          background: "rgba(0,229,255,0.05)",
          top: -200,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
      <div
        className="orb"
        style={{
          width: 320,
          height: 320,
          background: "rgba(0,229,255,0.03)",
          bottom: 40,
          right: -60,
        }}
      />

      {/* ── Nav ── */}
      <header
        className="nav-glass"
        style={{ position: "sticky", top: 0, zIndex: 50 }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 24px",
            height: 62,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <span className="display-heading" style={{ fontSize: "1.1rem" }}>
              Meoww
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <Link to="/chat" className="pill-btn">
              Start Chatting →
            </Link>

            <div ref={dropRef} style={{ position: "relative" }}>
              <div className="theme-trigger" onClick={() => setOpen((p) => !p)}>
                <Palette size={15} />
              </div>
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.93 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.93 }}
                    transition={{ duration: 0.15 }}
                    className="glass"
                    style={{
                      position: "absolute",
                      top: 44,
                      right: 0,
                      display: "flex",
                      gap: 8,
                      padding: "10px 12px",
                    }}
                  >
                    {Object.keys(themes).map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          setThemeKey(key);
                          setOpen(false);
                        }}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: themes[key].colors.primary,
                          border: `2px solid ${themeKey === key ? "#fff" : "transparent"}`,
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        {/* ── Hero ── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            paddingTop: "clamp(56px, 9vw, 110px)",
            paddingBottom: "clamp(36px, 7vw, 72px)",
          }}
        >
          <motion.div
            variants={fadeUp}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              borderRadius: 99,
              border: "1px solid var(--glass-border)",
              background: "var(--glass-bg)",
              marginBottom: 24,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent)",
                boxShadow: "0 0 8px var(--accent)",
              }}
            />
            <span className="section-label">
              Anonymous · Real-time · WebRTC
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="display-heading"
            style={{ fontSize: "clamp(2.4rem, 7vw, 5rem)", maxWidth: 760 }}
          >
            Meet Someone New.
            <br />
            <span
              style={{
                color: "var(--accent)",
                textShadow: "0 0 60px var(--accent-glow)",
              }}
            >
              Instantly.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="body-text"
            style={{
              marginTop: 16,
              fontSize: "clamp(0.87rem, 1.8vw, 1rem)",
              maxWidth: 440,
            }}
          >
            Jump into a live video chat with a stranger.
          </motion.p>

          <motion.div
            variants={fadeUp}
            style={{
              display: "flex",
              gap: 10,
              marginTop: 30,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Link to="/chat" className="pill-btn">
              Start Chatting →
            </Link>
            <a
              href="#how-it-works"
              className="ghost-btn"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              How it works
            </a>
          </motion.div>
        </motion.section>

        {/* ── Interest Tags ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, margin: "-40px" }}
          className="glass"
          style={{
            padding: "clamp(22px, 4vw, 34px)",
            marginBottom: "clamp(60px, 10vw, 100px)",
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <div className="section-label" style={{ marginBottom: 6 }}>
              Pick your vibe
            </div>
            <h2
              className="display-heading"
              style={{ fontSize: "clamp(1.05rem, 2.5vw, 1.45rem)" }}
            >
              What are you here for?
            </h2>
            <p
              className="body-text"
              style={{ marginTop: 6, fontSize: "0.83rem" }}
            >
              Pick up to 3 interests to match with people on the same
              wavelength.
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {INTERESTS.map(({ icon, label }) => (
              <motion.div
                key={label}
                className={`tag ${selected.includes(label) ? "active" : ""}`}
                onClick={() => toggle(label)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
              >
                <span className="tag-dot" />
                <span style={{ display: "flex", alignItems: "center" }}>
                  {icon}
                </span>
                <span>{label}</span>
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {selected.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto", marginTop: 18 }}
                exit={{ opacity: 0, y: 8, height: 0, marginTop: 0 }}
                transition={{ duration: 0.28 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <span className="body-text" style={{ fontSize: "0.82rem" }}>
                  {selected.length} vibe{selected.length > 1 ? "s" : ""}{" "}
                  selected
                </span>
                <Link
                  to={`/chat?tags=${selected.join(",")}`}
                  className="pill-btn"
                  style={{ fontSize: "0.82rem", padding: "8px 20px" }}
                >
                  Match me →
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* ── How it works ── */}
        <motion.section
          id="how-it-works"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, margin: "-40px" }}
          style={{ marginBottom: "clamp(60px, 10vw, 100px)" }}
        >
          <div style={{ marginBottom: 24 }}>
            <div className="section-label" style={{ marginBottom: 6 }}>
              How it works
            </div>
            <h2
              className="display-heading"
              style={{ fontSize: "clamp(1.05rem, 2.5vw, 1.45rem)" }}
            >
              Up and running in seconds.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {[
              {
                icon: <MousePointerClick size={18} />,
                step: "01",
                title: "Pick your vibe",
                desc: "Choose interests from the tags above so we know who to pair you with.",
              },
              {
                icon: <Shuffle size={18} />,
                step: "02",
                title: "Get matched",
                desc: "Hit 'Match me' and we instantly connect you with someone sharing your interests.",
              },
              {
                icon: <MessageSquareHeart size={18} />,
                step: "03",
                title: "Start talking",
                desc: "Your camera and mic go live. Say hi, chat freely — skip anytime to meet someone new.",
              },
            ].map(({ icon, step, title, desc }, i, arr) => (
              <div
                key={step}
                style={{ display: "flex", alignItems: "stretch", gap: 12 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: i * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  viewport={{ once: true }}
                  className="glass"
                  style={{
                    flex: 1,
                    padding: "24px 22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  {/* Step number + icon row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: "var(--accent-dim)",
                        border: "1px solid rgba(0,229,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--accent)",
                      }}
                    >
                      {icon}
                    </div>
                    <span
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 800,
                        fontSize: "1.8rem",
                        color: "rgba(255,255,255,0.06)",
                        letterSpacing: "-0.04em",
                        lineHeight: 1,
                      }}
                    >
                      {step}
                    </span>
                  </div>

                  <div>
                    <h3
                      className="display-heading"
                      style={{ fontSize: "0.98rem", marginBottom: 8 }}
                    >
                      {title}
                    </h3>
                    <p className="body-text" style={{ fontSize: "0.82rem" }}>
                      {desc}
                    </p>
                  </div>
                </motion.div>

                {/* Arrow connector — hidden on last */}
                {i < arr.length - 1 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: "rgba(255,255,255,0.12)",
                      flexShrink: 0,
                      alignSelf: "center",
                    }}
                  >
                    <ArrowRight size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.section>
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid var(--glass-border)",
          padding: "18px 24px",
          textAlign: "center",
        }}
      >
        <span
          className="body-text"
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          © 2026 Meoww · Built with WebRTC
        </span>
      </footer>
    </div>
  );
}
