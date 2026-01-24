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
      const saved = localStorage.getItem("theme");
      if (saved) return saved;
      return "light";
    };

    const savedTheme = getInitialTheme();
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");

    // Listen for system theme changes if system theme is selected
    if (
      initialTheme === "system" ||
      (!initialTheme && localStorage.getItem("theme") === "system")
    ) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e) => {
        const newTheme = e.matches ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [initialTheme]);

  const toggleTheme = () => {
    const currentTheme =
      theme === "system"
        ? document.documentElement.classList.contains("dark")
          ? "dark"
          : "light"
        : theme;
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const setThemePreference = (newTheme) => {
    if (newTheme === "system") {
      const systemTheme =
        typeof window !== "undefined" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      setTheme("system");
      localStorage.setItem("theme", "system");
      document.documentElement.classList.toggle("dark", systemTheme === "dark");
    } else {
      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
    }
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
