export const TIERS = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise",
};

export const CREDIT_RATE = 0.2; // $1 = 5 credits, so $10 = 50 credits

export const CREDIT_PACKS = [
  { id: "credits_25", credits: 25, price: 5 },
  { id: "credits_50", credits: 50, price: 10, popular: true },
  { id: "credits_120", credits: 120, price: 20 },
];

export const PRODUCTS = [
  { id: "course_generation", name: "Course Generation", price: 8, creditCost: 40, description: "Generate unlimited courses" },
  { id: "report_generation", name: "Report Generation", price: 5, creditCost: 25, description: "Generate unlimited reports & essays" },
  { id: "career_tools", name: "Career Tools", price: 5, creditCost: 25, description: "CV, cover letter, applications & job matching" },
  { id: "exam_generation", name: "Exam Generation", price: 5, creditCost: 25, description: "Generate unlimited exams (50 quizzes each)" },
  { id: "flashcard_generation", name: "Flashcard Generation", price: 5, creditCost: 25, description: "Generate unlimited flashcards (50 per batch)" },
];

export function hasItem(user, itemType) {
  if (!user) return false;
  if (user.isPremium) return true;
  return user.purchasedItems?.some((p) => p.itemType === itemType);
}

export function hasCredits(user, itemType) {
  if (!user) return false;
  const product = PRODUCTS.find((p) => p.id === itemType);
  if (!product) return false;
  return (user.credits || 0) >= product.creditCost;
}

export function canAccess(user, itemType) {
  return hasItem(user, itemType) || hasCredits(user, itemType);
}

export function getUserPlanLimits(user) {
  if (!user) return getFreeLimits();

  const hasPurchased = (type) => hasItem(user, type);

  const free = getFreeLimits();
  const limits = { ...free };

  if (hasPurchased("course_generation") || hasCredits(user, "course_generation")) {
    limits.courses = -1;
    limits.generateCourseLimit = -1;
    limits.difficulties = ["beginner", "intermediate", "advanced"];
    limits.freeReadableModules = 20;
    limits.modules = 20;
  }

  if (hasPurchased("report_generation") || hasCredits(user, "report_generation")) {
    limits.reportGenerations = -1;
  }

  if (hasPurchased("career_tools") || hasCredits(user, "career_tools")) {
    limits.careerLimit = -1;
  }

  if (hasPurchased("exam_generation") || hasCredits(user, "exam_generation")) {
    limits.quizzes = -1;
    limits.quizGenerations = -1;
  }

  if (hasPurchased("flashcard_generation") || hasCredits(user, "flashcard_generation")) {
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
