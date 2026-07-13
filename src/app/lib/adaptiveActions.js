export function getAdaptiveActionContext({ adaptiveInsights, quizTrends = [], courseProgress = [] }) {
  const focusAreas = adaptiveInsights?.focusAreas || [];
  const nextBestAction = adaptiveInsights?.nextBestAction || {};
  const weakTopic = focusAreas[0]?.title || "your current topic";
  const lowScoreTopic = quizTrends.find((quiz) => Number(quiz.score || 0) < 60)?.title || weakTopic;
  const inProgressCourse = courseProgress.find((course) => Number(course.progress || 0) > 0 && Number(course.progress || 0) < 100);

  return {
    weakTopic,
    lowScoreTopic,
    inProgressCourse: inProgressCourse?.title || null,
    nextBestActionTitle: nextBestAction.title || "Keep the streak alive",
    nextBestActionDescription: nextBestAction.description || "Complete one short review session today.",
  };
}
