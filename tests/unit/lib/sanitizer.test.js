import { describe, it, expect, vi } from "vitest";

// Mock DOMPurify for Node environment
vi.mock("isomorphic-dompurify", () => ({
  default: {
    sanitize: vi.fn((html) => html),
  },
}));

const { sanitizeHTML, createSafeHTMLFragment } = await import(
  "../../../src/lib/sanitizer.js"
);

describe("sanitizer", () => {
  describe("sanitizeHTML", () => {
    it("returns empty string for null input", () => {
      expect(sanitizeHTML(null)).toBe("");
    });

    it("returns empty string for undefined input", () => {
      expect(sanitizeHTML(undefined)).toBe("");
    });

    it("returns empty string for non-string input", () => {
      expect(sanitizeHTML(123)).toBe("");
      expect(sanitizeHTML({})).toBe("");
      expect(sanitizeHTML([])).toBe("");
    });

    it("returns sanitized string for valid HTML", () => {
      const html = "<p>Hello World</p>";
      expect(sanitizeHTML(html)).toBe(html);
    });

    it("handles empty string", () => {
      expect(sanitizeHTML("")).toBe("");
    });
  });

  describe("createSafeHTMLFragment", () => {
    it("returns object with __html property", () => {
      const result = createSafeHTMLFragment("<p>test</p>");
      expect(result).toHaveProperty("__html");
    });

    it("sanitizes the HTML content", () => {
      const result = createSafeHTMLFragment("<b>bold</b>");
      expect(result.__html).toBe("<b>bold</b>");
    });
  });
});
