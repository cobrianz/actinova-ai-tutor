import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

async function handleGet(request) {
  const user = request.user;
  const { db } = await connectToDatabase();
  const usersCol = db.collection("users");

  // Fetch actual API usage from the unified tracking collection
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const usageDoc = await db.collection("api_usage").findOne({
    userId: user._id,
    month: monthStart,
    apiName: "generateCourseLimit"
  });
  
  let monthlyUsage = usageDoc ? usageDoc.count : 0;

  // USER REQUEST: Refresh content on login (or daily)
  const lastRefresh = user.lastContentRefresh ? new Date(user.lastContentRefresh) : null;
  const isRefreshTime = !lastRefresh || (now.getTime() - lastRefresh.getTime() > 24 * 60 * 60 * 1000);

  if (isRefreshTime) {
    try {
      const { refreshUserContent } = await import("@/lib/refreshContent");
      await refreshUserContent(user._id.toString());
      await usersCol.updateOne(
        { _id: user._id },
        { $set: { lastContentRefresh: now } }
      );
    } catch (err) {
      console.error("Delayed refresh failed:", err);
    }
  }

  const { getUserPlanLimits, TIERS } = await import("@/lib/planLimits");
  const limits = getUserPlanLimits(user);
  
  const tier = user.subscription?.tier || (user.isPremium ? TIERS.PRO : TIERS.FREE);
  const isPremium = user.isPremium || 
    tier === TIERS.PRO || 
    tier === TIERS.ENTERPRISE ||
    (user.subscription?.plan === "premium" && user.subscription?.status === "active");

  const usage = {
    used: monthlyUsage,
    limit: limits.courses,
    remaining: Math.max(0, limits.courses - monthlyUsage),
    percentage: Math.round((monthlyUsage / limits.courses) * 100),
    isPremium,
    resetsOn: new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
  };

  const safeUser = {
    id: user._id.toString(),
    name: user.name || user.email.split("@")[0],
    email: user.email,
    avatar: user.avatar || null,
    streak: user.streak || 0,
    totalLearningTime: user.totalLearningTime || 0,
    achievements: user.achievements || [],
    emailVerified: user.emailVerified || false,
    status: user.status,
    onboardingCompleted: user.onboardingCompleted || false,
    isPremium,
    subscription: user.subscription,
    usage,
  };

  return NextResponse.json({ user: safeUser });
}

export const GET = combineMiddleware(
  withErrorHandling,
  withAuth
)(handleGet);
