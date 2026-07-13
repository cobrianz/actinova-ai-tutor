import { PRODUCTS } from "./planLimits";

/**
 * Maps frontend detail keys to the usage field names stored by trackAPIUsage
 * on the user document (users.usage.<key>).
 */
const USAGE_KEYS = {
  courses: "generate-course",
  flashcards: "generate-flashcards",
  quizzes: "quiz",
  reports: "generate-report-section",
  chat: "ai-tutor-chat",
  career: "career",
  studyPlans: "generate-study-plan",
};

/**
 * Maps frontend detail keys to the PRODUCTS id used for credit checking.
 */
const PRODUCT_KEYS = {
  courses: "course_generation",
  flashcards: "flashcard_generation",
  quizzes: "exam_generation",
  reports: "report_generation",
  career: "career_tools",
  studyPlans: "study_plan_generation",
};

export async function getTrackedUsageSummary(db, user, options = {}) {
  const { lifetime = false } = options;

  if (lifetime) {
    return getLifetimeSummary(db, user);
  }

  // Read usage counts directly from the user document (where trackAPIUsage writes)
  const userDoc = await db
    .collection("users")
    .findOne(
      { _id: user._id },
      { projection: { usage: 1, credits: 1, purchasedItems: 1, isPremium: 1 } }
    );

  const userUsage = userDoc?.usage || {};
  const credits = userDoc?.credits ?? 0;
  const isPremium = userDoc?.isPremium || false;
  const purchasedItems = userDoc?.purchasedItems || [];

  const details = {};

  for (const [key, usageKey] of Object.entries(USAGE_KEYS)) {
    const used = userUsage[usageKey] || 0;
    const product = PRODUCTS.find((p) => p.id === PRODUCT_KEYS[key]);

    let limit;
    let remaining;

    if (isPremium) {
      limit = -1; // unlimited
      remaining = -1;
    } else if (product && purchasedItems.some((p) => p.itemType === PRODUCT_KEYS[key])) {
      limit = -1; // purchased this feature → unlimited
      remaining = -1;
    } else if (product) {
      // Credit-based: how many more can the user afford?
      limit = Math.floor(credits / product.creditCost);
      remaining = credits;
    } else {
      limit = -1;
      remaining = credits;
    }

    details[key] = {
      used,
      limit,
      remaining,
      feature: usageKey,
    };
  }

  const totalUsed = Object.values(details).reduce((sum, item) => sum + item.used, 0);

  return {
    used: totalUsed,
    isEnterprise: isPremium,
    details,
  };
}

async function getLifetimeSummary(db, user) {
  const [courseDocs, lifetimeReports, lifetimeCareers, lifetimeQuizzes, lifetimeChats, lifetimeFlashcards, lifetimeStudyPlans] = await Promise.all([
    db.collection("library").find({ userId: user._id, format: "course" }).project({ title: 1, topic: 1, difficulty: 1, sourceMarketplaceCourseId: 1 }).toArray(),
    db.collection("reports").countDocuments({ userId: user._id }),
    db.collection("careerhistories").countDocuments({ userId: user._id }),
    db.collection("tests").countDocuments({ userId: user._id }),
    db.collection("chats").countDocuments({ userId: user._id }),
    db.collection("cardSets").countDocuments({ userId: user._id }),
    db.collection("library").countDocuments({ userId: user._id, format: "study_plan" }),
  ]);

  const normalizeKey = (v) => String(v || "").trim().toLowerCase().replace(/\s+/g, " ");
  const dedupedCourses = new Map();
  for (const c of courseDocs) {
    const key = c.sourceMarketplaceCourseId
      ? `m:${String(c.sourceMarketplaceCourseId)}`
      : `u:${normalizeKey(c.topic || c.title)}:${normalizeKey(c.difficulty)}`;
    dedupedCourses.set(key, true);
  }
  const lifetimeCourses = dedupedCourses.size;

  const details = {
    courses: { used: lifetimeCourses, limit: -1, remaining: -1, feature: "lifetimeCourses" },
    reports: { used: lifetimeReports, limit: -1, remaining: -1, feature: "lifetimeReports" },
    career: { used: lifetimeCareers, limit: -1, remaining: -1, feature: "lifetimeCareer" },
    quizzes: { used: lifetimeQuizzes, limit: -1, remaining: -1, feature: "lifetimeQuizzes" },
    chat: { used: lifetimeChats, limit: -1, remaining: -1, feature: "lifetimeChats" },
    flashcards: { used: lifetimeFlashcards, limit: -1, remaining: -1, feature: "lifetimeFlashcards" },
    studyPlans: { used: lifetimeStudyPlans, limit: -1, remaining: -1, feature: "lifetimeStudyPlans" },
  };

  const totalUsed = Object.values(details).reduce((sum, item) => sum + item.used, 0);

  return {
    used: totalUsed,
    isEnterprise: false,
    details,
  };
}
