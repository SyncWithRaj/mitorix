/**
 * Theme Management Utilities for CodeFlow
 *
 * Provides dark/light theme toggle with CSS custom properties.
 * Ported from architecture.md CSS Design System (lines 462-497).
 */

export type Theme = "dark" | "light";

/**
 * CSS custom properties for dark theme.
 */
const DARK_THEME = {
  "--bg0": "#0a0a0f",
  "--bg1": "#12121a",
  "--bg2": "#1a1a24",
  "--bg3": "#24242e",
  "--t0": "#ffffff",
  "--t1": "#e0e0e8",
  "--t2": "#8888a0",
  "--t3": "#55556a",
  "--acc": "#00ff9d",
  "--accbg": "rgba(0,255,157,0.12)",
  "--border": "#2a2a38",
  "--red": "#ff5f5f",
  "--orange": "#ff9f43",
  "--green": "#22c55e",
  "--blue": "#4d9fff",
  "--purple": "#a855f7",
};

/**
 * CSS custom properties for light theme.
 */
const LIGHT_THEME = {
  "--bg0": "#f8f9fc",
  "--bg1": "#ffffff",
  "--bg2": "#f0f1f5",
  "--bg3": "#e4e5eb",
  "--t0": "#1a1a2e",
  "--t1": "#2d2d44",
  "--t2": "#6b6b88",
  "--t3": "#9999b0",
  "--acc": "#00b36b",
  "--accbg": "rgba(0,179,107,0.12)",
  "--border": "#d8d9e0",
  "--red": "#dc2626",
  "--orange": "#ea580c",
  "--green": "#16a34a",
  "--blue": "#2563eb",
  "--purple": "#9333ea",
};

/**
 * Get current theme from localStorage or system preference.
 */
export function getCurrentTheme(): Theme {
  if (typeof window === "undefined") return "dark";

  // Check localStorage first
  const stored = localStorage.getItem("codeflow-theme") as Theme | null;
  if (stored === "dark" || stored === "light") {
    return stored;
  }

  // Fall back to system preference
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }

  return "dark";
}

/**
 * Apply theme to document root.
 */
export function applyTheme(theme: Theme): void {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const themeVars = theme === "dark" ? DARK_THEME : LIGHT_THEME;

  // Apply CSS custom properties
  Object.entries(themeVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Update body class for additional styling
  if (theme === "light") {
    document.body.classList.add("light");
    document.body.classList.remove("dark");
  } else {
    document.body.classList.add("dark");
    document.body.classList.remove("light");
  }

  // Save to localStorage
  localStorage.setItem("codeflow-theme", theme);
}

/**
 * Toggle between dark and light theme.
 */
export function toggleTheme(): Theme {
  const current = getCurrentTheme();
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

/**
 * Initialize theme on app load.
 */
export function initializeTheme(): void {
  const theme = getCurrentTheme();
  applyTheme(theme);
}

/**
 * Listen for system theme changes.
 */
export function watchSystemTheme(callback: (theme: Theme) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");

  const handler = (e: MediaQueryListEvent) => {
    const theme = e.matches ? "light" : "dark";
    callback(theme);
  };

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }

  // Legacy browsers
  mediaQuery.addListener(handler);
  return () => mediaQuery.removeListener(handler);
}

/**
 * Get theme-aware color value.
 */
export function getThemeColor(colorKey: keyof typeof DARK_THEME, theme?: Theme): string {
  const currentTheme = theme || getCurrentTheme();
  const themeVars = currentTheme === "dark" ? DARK_THEME : LIGHT_THEME;
  return themeVars[colorKey] || DARK_THEME[colorKey];
}
