import { describe, it, expect } from "vitest";
import {
  PRODUCTS,
  CREDIT_PACKS,
  SIGNUP_CREDITS,
  hasItem,
  getFeatureLimits,
  canAccessDifficulty,
} from "@/lib/planLimits";

describe("planLimits", () => {
  describe("PRODUCTS", () => {
    it("has 5 product types", () => {
      expect(PRODUCTS).toHaveLength(5);
    });

    it("each product has id, name, and creditCost", () => {
      for (const product of PRODUCTS) {
        expect(product).toHaveProperty("id");
        expect(product).toHaveProperty("name");
        expect(product).toHaveProperty("creditCost");
        expect(typeof product.creditCost).toBe("number");
        expect(product.creditCost).toBeGreaterThan(0);
      }
    });

    it("course_generation costs 40 credits", () => {
      const course = PRODUCTS.find((p) => p.id === "course_generation");
      expect(course.creditCost).toBe(40);
    });

    it("other products cost 25 credits", () => {
      const others = PRODUCTS.filter((p) => p.id !== "course_generation");
      for (const product of others) {
        expect(product.creditCost).toBe(25);
      }
    });
  });

  describe("CREDIT_PACKS", () => {
    it("has 3 credit packs", () => {
      expect(CREDIT_PACKS).toHaveLength(3);
    });

    it("each pack has id, credits, price, and popular flag", () => {
      for (const pack of CREDIT_PACKS) {
        expect(pack).toHaveProperty("id");
        expect(pack).toHaveProperty("credits");
        expect(pack).toHaveProperty("price");
        expect(pack).toHaveProperty("popular");
        expect(typeof pack.credits).toBe("number");
        expect(typeof pack.price).toBe("number");
        expect(typeof pack.popular).toBe("boolean");
      }
    });

    it("popular pack is marked as popular", () => {
      const popular = CREDIT_PACKS.find((p) => p.id === "popular");
      expect(popular.popular).toBe(true);
    });

    it("non-popular packs are not popular", () => {
      const nonPopular = CREDIT_PACKS.filter((p) => p.id !== "popular");
      for (const pack of nonPopular) {
        expect(pack.popular).toBe(false);
      }
    });

    it("packs are ordered by credit amount", () => {
      const credits = CREDIT_PACKS.map((p) => p.credits);
      expect(credits).toEqual([...credits].sort((a, b) => a - b));
    });

    it("prices increase with credits", () => {
      const prices = CREDIT_PACKS.map((p) => p.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThan(prices[i - 1]);
      }
    });
  });

  describe("SIGNUP_CREDITS", () => {
    it("is 60", () => {
      expect(SIGNUP_CREDITS).toBe(60);
    });

    it("is a positive number", () => {
      expect(SIGNUP_CREDITS).toBeGreaterThan(0);
    });
  });

  describe("hasItem", () => {
    it("returns false for null user", () => {
      expect(hasItem(null, "course_generation")).toBe(false);
    });

    it("returns false for undefined user", () => {
      expect(hasItem(undefined, "course_generation")).toBe(false);
    });

    it("returns false when user has no purchasedItems", () => {
      expect(hasItem({}, "course_generation")).toBe(false);
    });

    it("returns true when item type exists", () => {
      const user = {
        purchasedItems: [{ itemType: "course_generation" }],
      };
      expect(hasItem(user, "course_generation")).toBe(true);
    });

    it("returns false when item type does not exist", () => {
      const user = {
        purchasedItems: [{ itemType: "report_generation" }],
      };
      expect(hasItem(user, "course_generation")).toBe(false);
    });

    it("returns false for empty purchasedItems array", () => {
      const user = { purchasedItems: [] };
      expect(hasItem(user, "course_generation")).toBe(false);
    });
  });

  describe("getFeatureLimits", () => {
    it("returns limits object", () => {
      const limits = getFeatureLimits({});
      expect(limits).toHaveProperty("maxCourses");
      expect(limits).toHaveProperty("maxQuizzes");
      expect(limits).toHaveProperty("maxFlashcards");
      expect(limits).toHaveProperty("maxModulesPerCourse");
      expect(limits).toHaveProperty("allowedDifficulties");
    });

    it("returns high limits for any user", () => {
      const limits = getFeatureLimits({});
      expect(limits.maxCourses).toBe(999);
      expect(limits.maxQuizzes).toBe(999);
      expect(limits.maxFlashcards).toBe(999);
    });

    it("allows all difficulty levels", () => {
      const limits = getFeatureLimits({});
      expect(limits.allowedDifficulties).toContain("beginner");
      expect(limits.allowedDifficulties).toContain("intermediate");
      expect(limits.allowedDifficulties).toContain("advanced");
      expect(limits.allowedDifficulties).toContain("expert");
    });
  });

  describe("canAccessDifficulty", () => {
    it("always returns true", () => {
      expect(canAccessDifficulty({}, "beginner")).toBe(true);
      expect(canAccessDifficulty({}, "advanced")).toBe(true);
      expect(canAccessDifficulty(null, "expert")).toBe(true);
    });
  });
});
