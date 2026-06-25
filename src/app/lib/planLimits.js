export const TIERS = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise",
};

export const PRODUCTS = [
  { id: "course_generation", name: "Course Generation", price: 8, description: "Generate unlimited courses" },
  { id: "report_generation", name: "Report Generation", price: 5, description: "Generate unlimited reports & essays" },
  { id: "career_tools", name: "Career Tools", price: 5, description: "CV, cover letter, applications & job matching" },
  { id: "exam_generation", name: "Exam Generation", price: 5, description: "Generate unlimited exams (50 quizzes each)" },
  { id: "flashcard_generation", name: "Flashcard Generation", price: 5, description: "Generate unlimited flashcards (50 per batch)" },
];

export function getUserPlanLimits(user) {
  if (!user) return getFreeLimits();

  const hasPurchased = (type) =>
    user.isPremium || user.purchasedItems?.some((p) => p.itemType === type);

  const free = getFreeLimits();
  const limits = { ...free };

  if (hasPurchased("course_generation")) {
    limits.courses = -1;
    limits.generateCourseLimit = -1;
    limits.difficulties = ["beginner", "intermediate", "advanced"];
    limits.freeReadableModules = 20;
    limits.modules = 20;
  }

  if (hasPurchased("report_generation")) {
    limits.reportGenerations = -1;
  }

  if (hasPurchased("career_tools")) {
    limits.careerLimit = -1;
  }

  if (hasPurchased("exam_generation")) {
    limits.quizzes = -1;
    limits.quizGenerations = -1;
  }

  if (hasPurchased("flashcard_generation")) {
    limits.flashcards = -1;
  }

  return limits;
}

export function checkLimit(user, feature, currentUsage) {
  const limits = getUserPlanLimits(user);
  const limit = limits[feature];

  if (limit === -1) {
    return { allowed: true, limit: -1, remaining: -1, isUnlimited: true };
  }

  const remaining = Math.max(0, limit - currentUsage);
  const allowed = currentUsage < limit;

  return { allowed, limit, remaining, isUnlimited: false };
}

export function getUserPlanName(user) {
  if (!user) return "Free";
  if (user.isPremium) return "Pro";
  if (user.purchasedItems?.length > 0) return "Premium";
  return "Free";
}

function getFreeLimits() {
  return {
    courses: 2,
    quizzes: 1,
    flashcards: 8,
    modules: 20,
    lessonsPerModule: 5,
    totalLessons: 100,
    freeReadableModules: 2,
    difficulties: ["beginner"],
    aiResponses: 3,
    generateCourseLimit: 2,
    quizGenerations: 2,
    reportGenerations: 0,
    careerLimit: 2,
  };
}

export function formatLimit(limit) {
  return limit === -1 ? "Unlimited" : limit.toString();
}

export function canAccessDifficulty(user, difficulty) {
  const limits = getUserPlanLimits(user);
  return limits.difficulties.includes(difficulty.toLowerCase());
}
