import { describe, it, expect } from "vitest";
import {
  XP_REWARDS,
  xpForLevel,
  calculateLevel,
  BADGES,
  checkBadges,
  getRarityColor,
  getAllBadgesWithStatus,
} from "@/lib/gamification";

describe("gamification", () => {
  describe("XP_REWARDS", () => {
    it("has lesson_complete reward", () => {
      expect(XP_REWARDS.lesson_complete).toBe(10);
    });

    it("has quiz_complete reward", () => {
      expect(XP_REWARDS.quiz_complete).toBe(15);
    });

    it("has quiz_perfect bonus", () => {
      expect(XP_REWARDS.quiz_perfect).toBe(25);
    });

    it("has course_complete reward", () => {
      expect(XP_REWARDS.course_complete).toBe(50);
    });

    it("all rewards are positive", () => {
      for (const [key, value] of Object.entries(XP_REWARDS)) {
        expect(value).toBeGreaterThan(0);
      }
    });
  });

  describe("xpForLevel", () => {
    it("returns 0 for level 1", () => {
      expect(xpForLevel(1)).toBe(0);
    });

    it("returns 150 for level 2", () => {
      expect(xpForLevel(2)).toBe(150);
    });

    it("returns 225 for level 3", () => {
      expect(xpForLevel(3)).toBe(225);
    });

    it("increases exponentially", () => {
      const level5 = xpForLevel(5);
      const level10 = xpForLevel(10);
      expect(level10).toBeGreaterThan(level5);
    });

    it("level requirements increase with level", () => {
      for (let i = 2; i < 10; i++) {
        expect(xpForLevel(i + 1)).toBeGreaterThan(xpForLevel(i));
      }
    });
  });

  describe("calculateLevel", () => {
    it("returns level 1 for 0 XP", () => {
      const result = calculateLevel(0);
      expect(result.level).toBe(1);
      expect(result.currentXp).toBe(0);
    });

    it("returns level 2 for 150 XP", () => {
      const result = calculateLevel(150);
      expect(result.level).toBe(2);
      expect(result.currentXp).toBe(0);
    });

    it("returns level 1 for 149 XP", () => {
      const result = calculateLevel(149);
      expect(result.level).toBe(1);
      expect(result.currentXp).toBe(149);
    });

    it("handles large XP values", () => {
      const result = calculateLevel(10000);
      expect(result.level).toBeGreaterThan(1);
      expect(result.progress).toBeGreaterThanOrEqual(0);
      expect(result.progress).toBeLessThanOrEqual(100);
    });

    it("progress is between 0 and 100", () => {
      for (const xp of [0, 50, 100, 250, 500, 1000]) {
        const result = calculateLevel(xp);
        expect(result.progress).toBeGreaterThanOrEqual(0);
        expect(result.progress).toBeLessThanOrEqual(100);
      }
    });

    it("nextLevelXp is always positive", () => {
      const result = calculateLevel(500);
      expect(result.nextLevelXp).toBeGreaterThan(0);
    });
  });

  describe("BADGES", () => {
    it("has multiple badge definitions", () => {
      expect(Object.keys(BADGES).length).toBeGreaterThan(10);
    });

    it("each badge has name, description, icon, and rarity", () => {
      for (const [id, badge] of Object.entries(BADGES)) {
        expect(badge).toHaveProperty("name");
        expect(badge).toHaveProperty("description");
        expect(badge).toHaveProperty("icon");
        expect(badge).toHaveProperty("rarity");
        expect(["common", "rare", "epic", "legendary"]).toContain(badge.rarity);
      }
    });

    it("has unique names", () => {
      const names = Object.values(BADGES).map((b) => b.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe("checkBadges", () => {
    it("returns empty array for user with no achievements and no stats", () => {
      const badges = checkBadges({ achievements: [] }, {});
      expect(badges).toEqual([]);
    });

    it("awards first-lesson badge when user has completed lessons", () => {
      const user = { achievements: [], streak: { longest: 0 }, level: 1, xp: 0 };
      const badges = checkBadges(user, { totalLessonsCompleted: 1 });
      expect(badges.some((b) => b.badgeId === "first-lesson")).toBe(true);
    });

    it("does not re-award already earned badges", () => {
      const user = {
        achievements: [{ badgeId: "first-lesson" }],
        streak: { longest: 0 },
        level: 1,
        xp: 0,
      };
      const badges = checkBadges(user, { totalLessonsCompleted: 5 });
      expect(badges.some((b) => b.badgeId === "first-lesson")).toBe(false);
    });

    it("awards streak-7 badge for 7-day streak", () => {
      const user = { achievements: [], streak: { longest: 7 }, level: 1, xp: 0 };
      const badges = checkBadges(user, {});
      expect(badges.some((b) => b.badgeId === "streak-7")).toBe(true);
    });

    it("awards level-5 badge for level 5 user", () => {
      const user = { achievements: [], streak: { longest: 0 }, level: 5, xp: 0 };
      const badges = checkBadges(user, {});
      expect(badges.some((b) => b.badgeId === "level-5")).toBe(true);
    });

    it("awards xp-500 badge for 500 XP user", () => {
      const user = { achievements: [], streak: { longest: 0 }, level: 1, xp: 500 };
      const badges = checkBadges(user, {});
      expect(badges.some((b) => b.badgeId === "xp-500")).toBe(true);
    });

    it("awards multiple badges at once", () => {
      const user = { achievements: [], streak: { longest: 10 }, level: 5, xp: 600 };
      const badges = checkBadges(user, { totalLessonsCompleted: 1 });
      expect(badges.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("getRarityColor", () => {
    it("returns gray for common", () => {
      expect(getRarityColor("common")).toContain("gray");
    });

    it("returns blue for rare", () => {
      expect(getRarityColor("rare")).toContain("blue");
    });

    it("returns purple for epic", () => {
      expect(getRarityColor("epic")).toContain("purple");
    });

    it("returns amber for legendary", () => {
      expect(getRarityColor("legendary")).toContain("amber");
    });
  });

  describe("getAllBadgesWithStatus", () => {
    it("returns all badges with earned flag", () => {
      const user = { achievements: [{ badgeId: "first-lesson" }] };
      const allBadges = getAllBadgesWithStatus(user);
      expect(allBadges.length).toBe(Object.keys(BADGES).length);

      const firstLesson = allBadges.find((b) => b.badgeId === "first-lesson");
      expect(firstLesson.earned).toBe(true);

      const streak7 = allBadges.find((b) => b.badgeId === "streak-7");
      expect(streak7.earned).toBe(false);
    });

    it("includes earnedAt for earned badges", () => {
      const date = new Date("2026-01-01");
      const user = {
        achievements: [{ badgeId: "first-lesson", earnedAt: date }],
      };
      const allBadges = getAllBadgesWithStatus(user);
      const firstLesson = allBadges.find((b) => b.badgeId === "first-lesson");
      expect(firstLesson.earnedAt).toEqual(date);
    });
  });
});
