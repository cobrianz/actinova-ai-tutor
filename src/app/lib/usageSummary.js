import { TIERS } from "@/lib/planLimits";

const FEATURE_MAP = {
  courses: "generateCourseLimit",
  flashcards: "flashcards",
  quizzes: "quizGenerations",
  reports: "reportGenerations",
  chat: "aiResponses",
  career: "careerLimit",
};

export async function getTrackedUsageSummary(db, user, options = {}) {
  const { lifetime = false } = options;
  const tier =
    user.subscription?.tier || (user.isPremium ? TIERS.PRO : TIERS.FREE);
  const apiNames = Object.values(FEATURE_MAP);

  const usageQuery = {
    userId: user._id,
    apiName: { $in: apiNames },
  };
  if (!lifetime) usageQuery.month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const usageDocs = await db
    .collection("api_usage")
    .find(usageQuery)
    .toArray();

  const countsByApi = {};
  for (const doc of usageDocs) {
    countsByApi[doc.apiName] = (countsByApi[doc.apiName] || 0) + (doc.count || 0);
  }

  const details = Object.entries(FEATURE_MAP).reduce((acc, [key, limitKey]) => {
    acc[key] = { used: countsByApi[limitKey] || 0, feature: limitKey };
    return acc;
  }, {});

  if (lifetime) {
    const [courseDocs, lifetimeReports, lifetimeCareers, lifetimeQuizzes, lifetimeChats, lifetimeFlashcards] = await Promise.all([
      db.collection("library").find({ userId: user._id, format: "course" }).project({ title: 1, topic: 1, difficulty: 1, sourceMarketplaceCourseId: 1 }).toArray(),
      db.collection("reports").countDocuments({ userId: user._id }),
      db.collection("careerhistories").countDocuments({ userId: user._id }),
      db.collection("tests").countDocuments({ userId: user._id }),
      db.collection("chats").countDocuments({ userId: user._id }),
      db.collection("cardSets").countDocuments({ userId: user._id }),
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

    details.courses = { used: lifetimeCourses, feature: "lifetimeCourses" };
    details.reports = { used: lifetimeReports, feature: "lifetimeReports" };
    details.career = { used: lifetimeCareers, feature: "lifetimeCareer" };
    details.quizzes = { used: lifetimeQuizzes, feature: "lifetimeQuizzes" };
    details.chat = { used: lifetimeChats, feature: "lifetimeChats" };
    details.flashcards = { used: lifetimeFlashcards, feature: "lifetimeFlashcards" };
  }

  const totalUsed = Object.values(details).reduce((sum, item) => sum + item.used, 0);

  return {
    used: totalUsed,
    details,
    isPremium: tier === TIERS.PRO || tier === TIERS.ENTERPRISE,
    isEnterprise: tier === TIERS.ENTERPRISE,
    tier,
  };
}
