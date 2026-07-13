import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";

import {
  generateSecureToken,
  signAccessToken,
  signRefreshToken,
  generateTokenPair,
  verifyToken,
  verifyRefreshToken,
  generatePasswordResetToken,
  generateEmailVerificationToken,
  generateEmailVerificationCode,
  generatePasswordResetCode,
  validatePassword,
  validateEmail,
  sanitizeUser,
} from "@/lib/auth";

const JWT_SECRET = "test-secret-key-for-testing-only";

describe("auth", () => {
  describe("generateSecureToken", () => {
    it("generates a hex string", () => {
      const token = generateSecureToken();
      expect(typeof token).toBe("string");
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it("generates 64 chars by default (32 bytes)", () => {
      const token = generateSecureToken();
      expect(token.length).toBe(64);
    });

    it("generates tokens of specified byte length", () => {
      const token = generateSecureToken(16);
      expect(token.length).toBe(32);
    });

    it("generates unique tokens", () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecureToken());
      }
      expect(tokens.size).toBe(100);
    });
  });

  describe("signAccessToken", () => {
    it("returns a valid JWT string", () => {
      const token = signAccessToken({
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        role: "student",
      });
      expect(typeof token).toBe("string");
      const parts = token.split(".");
      expect(parts.length).toBe(3);
    });

    it("decodes to correct payload", () => {
      const user = {
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        role: "student",
      };
      const token = signAccessToken(user);
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.id).toBe(user._id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe("student");
      expect(decoded.type).toBe("access");
    });

    it("defaults role to student when not provided", () => {
      const token = signAccessToken({
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
      });
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.role).toBe("student");
    });

    it("includes issuer and audience", () => {
      const token = signAccessToken({
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
      });
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.iss).toBe("actirova-ai-tutor");
      expect(decoded.aud).toBe("actirova-ai-tutor-users");
    });

    it("accepts custom expiresIn option", () => {
      const token = signAccessToken(
        { _id: "507f1f77bcf86cd799439011", email: "test@example.com" },
        { expiresIn: "1h" }
      );
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.exp - decoded.iat).toBeCloseTo(3600, 0);
    });

    it("includes jti when provided on user object", () => {
      const token = signAccessToken({
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        jti: "custom-jti-123",
      });
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.jti).toBe("custom-jti-123");
    });
  });

  describe("signRefreshToken", () => {
    it("returns a valid JWT with type refresh", () => {
      const token = signRefreshToken({
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
      });
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.type).toBe("refresh");
    });
  });

  describe("generateTokenPair", () => {
    it("returns accessToken, refreshToken, and jti", () => {
      const pair = generateTokenPair({
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
      });
      expect(pair).toHaveProperty("accessToken");
      expect(pair).toHaveProperty("refreshToken");
      expect(pair).toHaveProperty("jti");
      expect(typeof pair.jti).toBe("string");
    });

    it("both tokens are valid JWTs", () => {
      const pair = generateTokenPair({
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
      });
      const accessDecoded = jwt.verify(pair.accessToken, JWT_SECRET);
      const refreshDecoded = jwt.verify(pair.refreshToken, JWT_SECRET);
      expect(accessDecoded.type).toBe("access");
      expect(refreshDecoded.type).toBe("refresh");
    });
  });

  describe("verifyToken", () => {
    it("verifies a valid token", () => {
      const token = signAccessToken({
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
      });
      const decoded = verifyToken(token);
      expect(decoded.id).toBe("507f1f77bcf86cd799439011");
    });

    it("throws for invalid token", () => {
      expect(() => verifyToken("invalid-token")).toThrow();
    });

    it("throws for expired token", () => {
      const token = jwt.sign(
        { id: "123", email: "test@test.com", type: "access" },
        JWT_SECRET,
        { expiresIn: "0s", issuer: "actirova-ai-tutor", audience: "actirova-ai-tutor-users" }
      );
      expect(() => verifyToken(token)).toThrow();
    });
  });

  describe("verifyRefreshToken", () => {
    it("verifies a valid refresh token", () => {
      const token = signRefreshToken({
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
      });
      const decoded = verifyRefreshToken(token);
      expect(decoded.type).toBe("refresh");
    });

    it("throws for access token", () => {
      const token = signAccessToken({
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
      });
      expect(() => verifyRefreshToken(token)).toThrow("Invalid token type");
    });
  });

  describe("generatePasswordResetToken", () => {
    it("returns a hex string", () => {
      const token = generatePasswordResetToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
      expect(token.length).toBe(64);
    });
  });

  describe("generateEmailVerificationToken", () => {
    it("returns a hex string", () => {
      const token = generateEmailVerificationToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
      expect(token.length).toBe(64);
    });
  });

  describe("generateEmailVerificationCode", () => {
    it("returns a 6-digit string", () => {
      const code = generateEmailVerificationCode();
      expect(code).toMatch(/^\d{6}$/);
    });

    it("generates unique codes", () => {
      const codes = new Set();
      for (let i = 0; i < 50; i++) {
        codes.add(generateEmailVerificationCode());
      }
      expect(codes.size).toBeGreaterThan(40);
    });
  });

  describe("generatePasswordResetCode", () => {
    it("returns a 6-digit string", () => {
      const code = generatePasswordResetCode();
      expect(code).toMatch(/^\d{6}$/);
    });
  });

  describe("validatePassword", () => {
    it("validates a strong password", () => {
      const result = validatePassword("StrongP@ss1");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects short passwords", () => {
      const result = validatePassword("Ab1!");
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("8 characters"))).toBe(true);
    });

    it("rejects passwords without uppercase", () => {
      const result = validatePassword("lowercase@1");
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("uppercase"))).toBe(true);
    });

    it("rejects passwords without lowercase", () => {
      const result = validatePassword("UPPERCASE@1");
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("lowercase"))).toBe(true);
    });

    it("rejects passwords without numbers", () => {
      const result = validatePassword("NoNumbers@Ab");
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("number"))).toBe(true);
    });

    it("rejects passwords without special characters", () => {
      const result = validatePassword("NoSpecial1Ab");
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("special character"))).toBe(true);
    });

    it("collects multiple errors", () => {
      const result = validatePassword("short");
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("validateEmail", () => {
    it("accepts valid emails", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name@domain.co")).toBe(true);
      expect(validateEmail("user+tag@domain.com")).toBe(true);
    });

    it("rejects invalid emails", () => {
      expect(validateEmail("")).toBe(false);
      expect(validateEmail("notanemail")).toBe(false);
      expect(validateEmail("@domain.com")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("user@.com")).toBe(false);
    });
  });

  describe("sanitizeUser", () => {
    it("removes password and refreshTokens", () => {
      const user = {
        _id: "123",
        email: "test@example.com",
        password: "hashed-password",
        refreshTokens: [{ token: "abc" }],
        name: "Test User",
      };
      const sanitized = sanitizeUser(user);
      expect(sanitized).not.toHaveProperty("password");
      expect(sanitized).not.toHaveProperty("refreshTokens");
      expect(sanitized.email).toBe("test@example.com");
      expect(sanitized.name).toBe("Test User");
    });

    it("does not mutate original user object", () => {
      const user = {
        _id: "123",
        password: "hashed",
        refreshTokens: [],
      };
      sanitizeUser(user);
      expect(user).toHaveProperty("password");
      expect(user).toHaveProperty("refreshTokens");
    });
  });
});
