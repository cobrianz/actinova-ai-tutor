import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    files: ["**/*.{js,jsx,mjs}"],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "@next/next/no-assign-module-variable": "off",
    },
  },
  {
    // Loosen rules for server-side code (API routes and server libs)
    files: [
      "src/app/api/**/*.js",
      "src/app/api/**/*.jsx",
      "src/app/lib/**/*.js",
      "src/lib/**/*.js",
    ],
    rules: {
      "no-console": "off",
      "@next/next/no-assign-module-variable": "off",
    },
  },
];

export default eslintConfig;
