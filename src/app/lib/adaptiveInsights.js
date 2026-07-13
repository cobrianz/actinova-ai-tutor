export function buildAdaptiveInsights({ summary = {}, courseProgress = [], quizTrends = [], user = {} }) {
  const averageQuizScore = Number(summary.averageQuizScore || 0);
  const masteredFlashcards = Number(summary.masteredFlashcards || 0);
  const totalFlashcards = Number(summary.totalFlashcards || 0);
  const flashcardMastery = totalFlashcards > 0 ? Math.round((masteredFlashcards / totalFlashcards) * 100) : 0;

  const progressScores = courseProgress.map((course) => Number(course.progress || 0));
  const avgCourseProgress = progressScores.length > 0
    ? Math.round(progressScores.reduce((sum, v) => sum + v, 0) / progressScores.length)
    : 0;

  const recentQuizScore = quizTrends.length > 0
    ? Math.round(quizTrends.reduce((sum, quiz) => sum + Number(quiz.score || 0), 0) / quizTrends.length)
    : averageQuizScore;

  const overallMasteryScore = Math.max(0, Math.min(100, Math.round(
    (avgCourseProgress * 0.45) + (recentQuizScore * 0.35) + (flashcardMastery * 0.2)
  )));

  const weakCourses = [...courseProgress]
    .filter((course) => Number(course.progress || 0) < 60)
    .sort((a, b) => Number(a.progress || 0) - Number(b.progress || 0))
    .slice(0, 3);

  const focusAreas = weakCourses.map((course) => ({
    title: course.title || "Learning focus",
    progress: Number(course.progress || 0),
    priority: Number(course.progress || 0) < 30 ? "high" : "medium",
  }));

  const nextBestAction = focusAreas.length > 0
    ? {
        title: `Resume ${focusAreas[0].title}`,
        description: focusAreas[0].progress < 30
          ? "Start with the fundamentals and revisit the earliest lessons."
          : "Reinforce this topic with a quick review and one practice quiz.",
      }
    : {
        title: "Build a steady routine",
        description: "Start with one short study session and track your progress daily.",
      };

  const goals = Array.isArray(user?.goals) ? user.goals : [];
  const recommendations = [];

  if (overallMasteryScore < 40) {
    recommendations.push({
      title: "Rebuild confidence with fundamentals",
      detail: "Focus on one topic at a time and complete a small review block before moving on.",
    });
  }

  if (quizTrends.length > 0) {
    recommendations.push({
      title: "Practice weak quiz topics",
      detail: "Revisit recent quiz topics with targeted review sessions to improve retention.",
    });
  }

  if (goals.includes("career-change")) {
    recommendations.push({
      title: "Anchor progress to a career milestone",
      detail: "Connect your next study block to a role-specific outcome like a resume skill or portfolio project.",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: "Keep the streak alive",
      detail: "Complete one short review session today to maintain momentum.",
    });
  }

  return {
    overallMasteryScore,
    focusAreas,
    nextBestAction,
    recommendations,
    flashcardMastery,
    avgCourseProgress,
    recentQuizScore,
  };
}
