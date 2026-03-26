import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getTrackedUsageSummary } from "@/lib/usageSummary";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

async function handleGet(request) {
  const user = request.user;
  const { db } = await connectToDatabase();
  const usersCol = db.collection("users");

  const now = new Date();

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

  const usage = await getTrackedUsageSummary(db, user);
  const isPremium = user.isPremium ||
    usage.tier === "pro" ||
    usage.tier === "enterprise" ||
    (user.subscription?.plan === "premium" && user.subscription?.status === "active");

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
