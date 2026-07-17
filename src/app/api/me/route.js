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

  const safeUser = {
    id: user._id.toString(),
    name: user.firstName ? `${user.firstName} ${user.lastName}` : (user.name || user.email.split("@")[0]),
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email,
    avatar: user.avatar || null,
    streak: typeof user.streak === "number" ? user.streak : (user.streak?.current || 0),
    streakData: typeof user.streak === "number"
      ? { current: user.streak, longest: user.streak, lastActiveDate: null, activeDates: [] }
      : (user.streak || { current: 0, longest: 0, lastActiveDate: null, activeDates: [] }),
    totalLearningTime: user.totalLearningTime || 0,
    achievements: user.achievements || [],
    emailVerified: user.emailVerified || false,
    status: user.status,
    onboardingCompleted: user.onboardingCompleted || false,
    purchasedItems: user.purchasedItems || [],
    credits: user.credits || 0,
    xp: user.xp || 0,
    level: user.level || 1,
    courses: user.courses || [],
    isPremium: user.isPremium || false,
    role: user.role || "student",
    usage,
  };

  return NextResponse.json({ user: safeUser });
}

export const GET = combineMiddleware(
  withErrorHandling,
  withAuth
)(handleGet);
