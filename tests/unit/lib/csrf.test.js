import { describe, it, expect } from "vitest";
import {
  generateCsrfToken,
  validateCsrfToken,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CSRF_TOKEN_LENGTH,
} from "@/lib/csrf";

describe("csrf", () => {
  describe("constants", () => {
    it("CSRF_COOKIE_NAME is csrfToken", () => {
      expect(CSRF_COOKIE_NAME).toBe("csrfToken");
    });

    it("CSRF_HEADER_NAME is X-CSRF-Token", () => {
      expect(CSRF_HEADER_NAME).toBe("X-CSRF-Token");
    });

    it("CSRF_TOKEN_LENGTH is 32", () => {
      expect(CSRF_TOKEN_LENGTH).toBe(32);
    });
  });

  describe("generateCsrfToken", () => {
    it("returns a hex string", () => {
      const token = generateCsrfToken();
      expect(typeof token).toBe("string");
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it("returns 64 chars (32 bytes hex)", () => {
      const token = generateCsrfToken();
      expect(token.length).toBe(64);
    });

    it("generates unique tokens", () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateCsrfToken());
      }
      expect(tokens.size).toBe(100);
    });
  });

  describe("validateCsrfToken", () => {
    it("returns true for matching tokens", () => {
      const token = generateCsrfToken();
      expect(validateCsrfToken(token, token)).toBe(true);
    });

    it("returns false for different tokens", () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(validateCsrfToken(token1, token2)).toBe(false);
    });

    it("returns false when header token is missing", () => {
      const token = generateCsrfToken();
      expect(validateCsrfToken(null, token)).toBe(false);
    });

    it("returns false when cookie token is missing", () => {
      const token = generateCsrfToken();
      expect(validateCsrfToken(token, null)).toBe(false);
    });

    it("returns false when both are missing", () => {
      expect(validateCsrfToken(null, null)).toBe(false);
    });

    it("returns false for non-string values", () => {
      expect(validateCsrfToken(123, "abc")).toBe(false);
      expect(validateCsrfToken("abc", 123)).toBe(false);
    });

    it("returns false for wrong length tokens", () => {
      expect(validateCsrfToken("short", "short")).toBe(false);
      expect(validateCsrfToken("a".repeat(64), "b".repeat(64))).toBe(false);
    });

    it("returns false for empty strings", () => {
      expect(validateCsrfToken("", "")).toBe(false);
    });
  });
});
