export const TIERS = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise",
};

export const SIGNUP_CREDITS = 60;

export const CREDIT_RATE = 0.2; // $1 = 5 credits, so $10 = 50 credits

export const CREDIT_PACKS = [
  { id: "credits_25", credits: 25, price: 5 },
  { id: "credits_50", credits: 50, price: 10, popular: true },
  { id: "credits_120", credits: 120, price: 20 },
];

export const PRODUCTS = [
  { id: "course_generation", name: "Course Generation", price: 8, creditCost: 40, description: "Generate courses" },
  { id: "report_generation", name: "Report Generation", price: 5, creditCost: 25, description: "Generate reports & essays" },
  { id: "career_tools", name: "Career Tools", price: 5, creditCost: 25, description: "CV, cover letter, applications & job matching" },
  { id: "exam_generation", name: "Exam Generation", price: 5, creditCost: 25, description: "Generate exams (50 quizzes each)" },
  { id: "flashcard_generation", name: "Flashcard Generation", price: 5, creditCost: 25, description: "Generate flashcards (50 per batch)" },
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

export function getFeatureLimits(user) {
  if (!user || user.isPremium) {
    return {
      courses: -1,
      quizzes: -1,
      flashcards: -1,
      modules: 20,
      lessonsPerModule: 5,
      totalLessons: 100,
      freeReadableModules: 20,
      difficulties: ["beginner", "intermediate", "advanced"],
      aiResponses: -1,
      generateCourseLimit: -1,
      quizGenerations: -1,
      reportGenerations: -1,
      careerLimit: -1,
    };
  }

  return {
    courses: 0,
    quizzes: 0,
    flashcards: 0,
    modules: 20,
    lessonsPerModule: 5,
    totalLessons: 100,
    freeReadableModules: 2,
    difficulties: ["beginner"],
    aiResponses: 0,
    generateCourseLimit: 0,
    quizGenerations: 0,
    reportGenerations: 0,
    careerLimit: 0,
  };
}

export function getUserPlanName(user) {
  if (!user) return "Free";
  if (user.isPremium) return "Pro";
  return "Free";
}

export function canAccessDifficulty(user, difficulty) {
  if (!user) return false;
  if (user.isPremium) return true;
  return difficulty === "beginner";
}
