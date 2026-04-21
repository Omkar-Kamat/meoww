import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette } from "lucide-react";
import { useTheme } from "../theme/useTheme";
import { themes } from "../theme/themes";
import { dropdownMotion } from "../ui.config";

const S = {
  wrapper: "relative",
  trigger:
    "w-9 h-9 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm flex items-center justify-center cursor-pointer text-white/50 transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]",
  dropdown:
    "absolute top-11 right-0 flex gap-2 p-2.5 bg-[rgba(8,8,8,0.9)] border border-white/10 backdrop-blur-xl rounded-2xl z-50",
  swatch:
    "w-[22px] h-[22px] rounded-full cursor-pointer transition-transform hover:scale-110",
};

export default function ThemeDropdown({
  position = "fixed",
  top = 18,
  right = 20,
}) {
  const { themeKey, setThemeKey } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div
      ref={ref}
      className={S.wrapper}
      style={{ position, top, right, zIndex: 100 }}
    >
      <div className={S.trigger} onClick={() => setOpen((p) => !p)}>
        <Palette size={15} />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className={S.dropdown} {...dropdownMotion}>
            {Object.keys(themes).map((key) => (
              <button
                key={key}
                className={S.swatch}
                onClick={() => {
                  setThemeKey(key);
                  setOpen(false);
                }}
                style={{
                  background: themes[key].colors.primary,
                  border: `2px solid ${themeKey === key ? "#fff" : "transparent"}`,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
