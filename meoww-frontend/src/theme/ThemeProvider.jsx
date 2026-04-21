import { useState, useEffect, useMemo } from "react";
import { themes } from "./themes";
import { ThemeContext } from "./theme-context";

/** Apply theme CSS variables to :root immediately (synchronous). */
function applyTheme(key) {
  const theme = themes[key];
  if (!theme) return;
  Object.entries(theme.colors).forEach(([k, v]) => {
    document.documentElement.style.setProperty(`--${k}`, v);
  });
}

// Apply on module load — before any component renders — so variables
// are present on the very first paint and on every client-side navigation.
// Guard against SSR / test environments where localStorage is unavailable.
const storedKey =
  typeof window !== "undefined"
    ? localStorage.getItem("theme") || "cosmic"
    : "cosmic";

if (typeof window !== "undefined") {
  applyTheme(storedKey);
}

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKeyState] = useState(storedKey);

  const setThemeKey = (key) => {
    if (typeof window !== "undefined") localStorage.setItem("theme", key);
    applyTheme(key);
    setThemeKeyState(key);
  };

  // Re-apply on mount in case SSR or HMR wiped the variables
  useEffect(() => {
    applyTheme(themeKey);
  }, []);

  const value = useMemo(() => ({ themeKey, setThemeKey }), [themeKey]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
