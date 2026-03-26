import { getUserPlanLimits, TIERS } from "@/lib/planLimits";

const FEATURE_MAP = {
  courses: "generateCourseLimit",
  flashcards: "flashcards",
  quizzes: "quizGenerations",
  reports: "reportGenerations",
  chat: "aiResponses",
  career: "careerLimit",
};

function formatResetDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getUsagePercent(used, limit) {
  if (limit === -1 || limit === null) {
    return 0;
  }

  if (limit <= 0) {
    return used > 0 ? 100 : 0;
  }

  return Math.min(100, Math.round((used / limit) * 100));
}

export async function getTrackedUsageSummary(db, user) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const limits = getUserPlanLimits(user);
  const tier =
    user.subscription?.tier || (user.isPremium ? TIERS.PRO : TIERS.FREE);
  const apiNames = Object.values(FEATURE_MAP);

  const usageDocs = await db
    .collection("api_usage")
    .find({
      userId: user._id,
      month: monthStart,
      apiName: { $in: apiNames },
    })
    .toArray();

  const countsByApi = usageDocs.reduce((acc, doc) => {
    acc[doc.apiName] = doc.count || 0;
    return acc;
  }, {});

  const details = Object.entries(FEATURE_MAP).reduce((acc, [key, limitKey]) => {
    const used = countsByApi[limitKey] || 0;
    const rawLimit = limits[limitKey];
    const isUnlimited = rawLimit === -1;
    const limit = isUnlimited ? null : rawLimit;
    const percent = getUsagePercent(used, rawLimit);

    acc[key] = {
      used,
      limit,
      remaining: isUnlimited ? null : Math.max(0, rawLimit - used),
      percent,
      feature: limitKey,
    };

    return acc;
  }, {});

  const detailValues = Object.values(details);
  const hasUnlimited = detailValues.some((item) => item.limit === null);
  const totalUsed = detailValues.reduce((sum, item) => sum + item.used, 0);
  const totalLimit = hasUnlimited
    ? null
    : detailValues.reduce((sum, item) => sum + item.limit, 0);
  const maxPercent = detailValues.reduce(
    (highest, item) => Math.max(highest, item.percent),
    0
  );

  return {
    used: totalUsed,
    limit: totalLimit,
    remaining: totalLimit === null ? null : Math.max(0, totalLimit - totalUsed),
    percentage: maxPercent,
    details,
    isNearLimit: maxPercent >= 80,
    isAtLimit: maxPercent >= 100,
    isPremium: tier === TIERS.PRO || tier === TIERS.ENTERPRISE,
    isEnterprise: tier === TIERS.ENTERPRISE,
    tier,
    resetsAt: nextReset.toISOString(),
    resetsOn: formatResetDate(nextReset),
  };
}
