import { describe, expect, it } from "vitest";
import { buildAdaptiveInsights } from "@/lib/adaptiveInsights";

describe("buildAdaptiveInsights", () => {
  it("builds a mastery score and highlights weak areas from progress data", () => {
    const insights = buildAdaptiveInsights({
      summary: {
        averageQuizScore: 58,
        masteredFlashcards: 2,
        totalFlashcards: 10,
      },
      courseProgress: [
        { title: "Python Basics", progress: 22 },
        { title: "React Essentials", progress: 84 },
      ],
      quizTrends: [{ title: "Python quiz", score: 45 }],
      user: { goals: ["career-change"] },
    });

    expect(insights.overallMasteryScore).toBeGreaterThan(0);
    expect(insights.focusAreas[0].title).toBe("Python Basics");
    expect(insights.nextBestAction.title).toBeDefined();
    expect(insights.recommendations.length).toBeGreaterThan(0);
  });

  it("returns safe fallback values when there is no learning data", () => {
    const insights = buildAdaptiveInsights({
      summary: {},
      courseProgress: [],
      quizTrends: [],
      user: {},
    });

    expect(insights.overallMasteryScore).toBe(0);
    expect(insights.focusAreas).toEqual([]);
    expect(insights.recommendations.length).toBeGreaterThan(0);
  });
});
