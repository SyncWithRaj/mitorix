"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { getCurrentTheme, toggleTheme, initializeTheme, type Theme } from "../../lib/theme.utils";

/**
 * Theme Toggle Button Component
 *
 * Provides a button to switch between dark and light themes.
 * Persists theme preference to localStorage.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initialize theme on mount
    initializeTheme();
    setTheme(getCurrentTheme());
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const newTheme = toggleTheme();
    setTheme(newTheme);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <button
        className="p-1.5 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d] rounded-md transition"
        disabled
      >
        <Moon size={16} />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className="p-1.5 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d] rounded-md transition"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
