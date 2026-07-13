import { describe, it, expect } from "vitest";
import { calculateNextReview, scoreToQuality } from "@/lib/srsUtils";

describe("srsUtils", () => {
  describe("calculateNextReview", () => {
    it("returns default state for null currentSrs", () => {
      const result = calculateNextReview(null, 3);
      expect(result).toHaveProperty("interval");
      expect(result).toHaveProperty("repetitions");
      expect(result).toHaveProperty("ease");
      expect(result).toHaveProperty("dueDate");
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it("returns default state for undefined currentSrs", () => {
      const result = calculateNextReview(undefined, 4);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it("sets interval to 1 for first successful repetition", () => {
      const currentSrs = { interval: 0, repetitions: 0, ease: 2.5 };
      const result = calculateNextReview(currentSrs, 3);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it("sets interval to 6 for second successful repetition", () => {
      const currentSrs = { interval: 1, repetitions: 1, ease: 2.5 };
      const result = calculateNextReview(currentSrs, 3);
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it("multiplies interval by ease for third+ repetition", () => {
      const currentSrs = { interval: 6, repetitions: 2, ease: 2.5 };
      const result = calculateNextReview(currentSrs, 3);
      expect(result.interval).toBe(15); // Math.round(6 * 2.5)
      expect(result.repetitions).toBe(3);
    });

    it("resets on failure (quality < 3)", () => {
      const currentSrs = { interval: 15, repetitions: 5, ease: 2.5 };
      const result = calculateNextReview(currentSrs, 1);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });

    it("resets on quality 0 (blackout)", () => {
      const currentSrs = { interval: 30, repetitions: 10, ease: 2.5 };
      const result = calculateNextReview(currentSrs, 0);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });

    it("increases ease factor for high quality (5)", () => {
      const currentSrs = { interval: 6, repetitions: 2, ease: 2.5 };
      const result = calculateNextReview(currentSrs, 5);
      expect(result.ease).toBeGreaterThan(2.5);
    });

    it("decreases ease factor for low quality (3)", () => {
      const currentSrs = { interval: 6, repetitions: 2, ease: 2.5 };
      const result = calculateNextReview(currentSrs, 3);
      expect(result.ease).toBeLessThan(2.5);
    });

    it("never goes below minimum ease of 1.3", () => {
      const currentSrs = { interval: 1, repetitions: 0, ease: 1.3 };
      const result = calculateNextReview(currentSrs, 0);
      expect(result.ease).toBeGreaterThanOrEqual(1.3);
    });

    it("sets dueDate in the future", () => {
      const currentSrs = { interval: 1, repetitions: 0, ease: 2.5 };
      const result = calculateNextReview(currentSrs, 4);
      const now = new Date();
      expect(result.dueDate.getTime()).toBeGreaterThan(now.getTime());
    });

    it("dueDate matches interval days from now", () => {
      const currentSrs = { interval: 1, repetitions: 0, ease: 2.5 };
      const result = calculateNextReview(currentSrs, 4);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + result.interval);
      expect(result.dueDate.toISOString().split("T")[0]).toBe(
        expectedDate.toISOString().split("T")[0]
      );
    });
  });

  describe("scoreToQuality", () => {
    it("returns 5 for score >= 95", () => {
      expect(scoreToQuality(95)).toBe(5);
      expect(scoreToQuality(100)).toBe(5);
    });

    it("returns 4 for score >= 85", () => {
      expect(scoreToQuality(85)).toBe(4);
      expect(scoreToQuality(94)).toBe(4);
    });

    it("returns 3 for score >= 70", () => {
      expect(scoreToQuality(70)).toBe(3);
      expect(scoreToQuality(84)).toBe(3);
    });

    it("returns 2 for score >= 50", () => {
      expect(scoreToQuality(50)).toBe(2);
      expect(scoreToQuality(69)).toBe(2);
    });

    it("returns 1 for score >= 30", () => {
      expect(scoreToQuality(30)).toBe(1);
      expect(scoreToQuality(49)).toBe(1);
    });

    it("returns 0 for score < 30", () => {
      expect(scoreToQuality(0)).toBe(0);
      expect(scoreToQuality(29)).toBe(0);
    });

    it("returns 5 for perfect score", () => {
      expect(scoreToQuality(100)).toBe(5);
    });

    it("returns 0 for zero score", () => {
      expect(scoreToQuality(0)).toBe(0);
    });
  });
});
