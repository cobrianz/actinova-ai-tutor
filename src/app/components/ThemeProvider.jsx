"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children, initialTheme }) {
  const [theme, setTheme] = useState(initialTheme || "light");

  useEffect(() => {
    const getSystemTheme = () => {
      // Ignore system preference for now to ensure light mode by default
      return "light";
    };

    const getInitialTheme = () => {
      if (typeof window === "undefined") return "light";
      const saved = localStorage.getItem("theme");
      if (!saved) {
        localStorage.setItem("theme", "light");
        return "light";
      }
      return saved;
    };

    const savedTheme = getInitialTheme();
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");

    return () => {
      // Cleanup: always revert to light mode when this provider unmounts (leaving dashboard)
      document.documentElement.classList.remove("dark");
    };
  }, [initialTheme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const setThemePreference = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
