/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#1a1a1a", // Global Primary is now the Brand Black
          600: "#000000",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        accent: {
          light: "#a855f7",
          DEFAULT: "#8b5cf6",
          dark: "#7c3aed",
        },
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "blob": "blob 7s infinite",
        "glow": "glow 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        blob: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
        },
        glow: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
      },
      backgroundImage: {
        "grid-pattern": "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40 L40 40 L40 0 M0 0 L0 40' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function ({ addUtilities }) {
      addUtilities({
        ".hide-scrollbar": {
          "&::-webkit-scrollbar": { display: "none" },
          "scrollbar-width": "none",
          "-ms-overflow-style": "none",
        },
        ".glass": {
          "background": "rgba(255, 255, 255, 0.03)",
          "backdrop-filter": "blur(12px)",
          "border": "1px solid rgba(255, 255, 255, 0.05)",
        },
        ".glass-light": {
          "background": "rgba(255, 255, 255, 0.7)",
          "backdrop-filter": "blur(12px)",
          "border": "1px solid rgba(255, 255, 255, 0.2)",
        },
      });
    },
  ],
};
