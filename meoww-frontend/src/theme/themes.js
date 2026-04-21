/**
 * themes.js
 *
 * Each theme declares:
 *   colors — mapped 1:1 to CSS custom properties by ThemeProvider
 *   dark   — true when the accent is light enough that button text should
 *            be dark. Replaces the scattered `themes[key]?.colors?.bg1 || "#000"`
 *            pattern in every component.
 */
export const themes = {
  sand: {
    name: "Sand",
    dark: false, // light theme → button text stays white
    colors: {
      bg1: "#F9F8F6",
      bg2: "#EFE9E3",
      primary: "#D9CFC7",
      accent: "#C9B59C",
      text: "#1a1a1a",
    },
  },

  cosmic: {
    name: "Cosmic",
    dark: true, // accent is light pink → use dark text on buttons
    colors: {
      bg1: "#15173D",
      bg2: "#982598",
      primary: "#E491C9",
      accent: "#F1E9E9",
      text: "#ffffff",
    },
  },

  forest: {
    name: "Forest",
    dark: false,
    colors: {
      bg1: "#84B179",
      bg2: "#A2CB8B",
      primary: "#C7EABB",
      accent: "#E8F5BD",
      text: "#1a1a1a",
    },
  },

  neon: {
    name: "Neon",
    dark: true,
    colors: {
      bg1: "#6367FF",
      bg2: "#8494FF",
      primary: "#C9BEFF",
      accent: "#FFDBFD",
      text: "#ffffff",
    },
  },
};

/**
 * Returns the correct text colour to use on an accent-coloured button
 * for the given theme key.
 *
 * Usage:  color: accentTextColor(themeKey)
 * Replaces: color: themes[themeKey]?.colors?.bg1 || "#000"
 */
export function accentTextColor(themeKey) {
  return themes[themeKey]?.dark ? themes[themeKey].colors.bg1 : "#000";
}
