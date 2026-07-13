import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.js"],
    include: ["tests/**/*.{test,spec}.{js,jsx}"],
    exclude: ["tests/mocks/**", "node_modules/**"],
    env: {
      JWT_SECRET: "test-secret-key-for-testing-only",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/app/lib/**", "src/app/api/**", "src/lib/**"],
      exclude: ["src/app/components/**", "src/app/models/**"],
    },
    pool: "forks",
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/app"),
      "@lib": path.resolve(__dirname, "src/app/lib"),
      "@models": path.resolve(__dirname, "src/app/models"),
      "@rootlib": path.resolve(__dirname, "src/lib"),
    },
  },
});
