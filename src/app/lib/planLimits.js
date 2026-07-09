export const PRODUCTS = [
  { id: "course_generation", name: "Course Generation", creditCost: 40 },
  { id: "report_generation", name: "Report Generation", creditCost: 25 },
  { id: "career_tools", name: "Career Tools", creditCost: 25 },
  { id: "exam_generation", name: "Exam Generation", creditCost: 25 },
  { id: "flashcard_generation", name: "Flashcard Generation", creditCost: 25 },
];

export const CREDIT_PACKS = [
  { id: "starter", credits: 50, price: 9.99, popular: false },
  { id: "popular", credits: 150, price: 19.99, popular: true },
  { id: "pro", credits: 500, price: 49.99, popular: false },
];

export const SIGNUP_CREDITS = 10;

export function hasItem(user, itemType) {
  return user?.purchasedItems?.some(item => item.itemType === itemType) ?? false;
}

export function getFeatureLimits(user) {
  return {
    maxCourses: 999,
    maxQuizzes: 999,
    maxFlashcards: 999,
    maxModulesPerCourse: 999,
    allowedDifficulties: ["beginner", "intermediate", "advanced", "expert"],
  };
}

export function canAccessDifficulty(user, difficulty) {
  return true;
}
