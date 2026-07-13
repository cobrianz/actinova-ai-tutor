import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { XP_REWARDS, calculateLevel, checkBadges } from "@/lib/gamification";

async function handleGet(request) {
  const authUser = request.user;
  const { db } = await connectToDatabase();

  // Re-fetch from raw DB — request.user from Mongoose lean() may be missing
  // gamification fields for users created via the signup route (raw MongoDB insert)
  const user = await db.collection("users").findOne(
    { _id: authUser._id },
    { projection: { xp: 1, level: 1, achievements: 1, dailyXp: 1, dailyXpDate: 1, streak: 1 } }
  );

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const levelInfo = calculateLevel(user.xp || 0);

  // Normalize streak — can be number (legacy) or object
  const rawStreak = user.streak;
  const streak = typeof rawStreak === "number"
    ? { current: rawStreak, longest: rawStreak, activeDates: [] }
    : (rawStreak || { current: 0, longest: 0, activeDates: [] });

  return NextResponse.json({
    success: true,
    xp: user.xp || 0,
    ...levelInfo,
    achievements: user.achievements || [],
    dailyXp: user.dailyXp || 0,
    streak,
  });
}

async function handlePost(request) {
  const user = request.user;
  const { db } = await connectToDatabase();
  const body = await request.json();
  const { action } = body;

  if (!action || !XP_REWARDS[action]) {
    return NextResponse.json(
      { error: "Invalid action", validActions: Object.keys(XP_REWARDS) },
      { status: 400 }
    );
  }

  const xpAmount = XP_REWARDS[action];
  const today = new Date().toISOString().split("T")[0];

  const userDoc = await db.collection("users").findOne(
    { _id: user._id },
    {
      projection: {
        xp: 1, level: 1, achievements: 1, dailyXp: 1, dailyXpDate: 1, streak: 1,
        courses: 1,
      },
    }
  );

  if (!userDoc) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Reset daily XP if it's a new day
  let newDailyXp = userDoc.dailyXp || 0;
  if (userDoc.dailyXpDate !== today) {
    newDailyXp = 0;
  }

  const oldXp = userDoc.xp || 0;
  const newXp = oldXp + xpAmount;
  const oldLevel = calculateLevel(oldXp).level;
  const newLevelInfo = calculateLevel(newXp);
  const levelUp = newLevelInfo.level > oldLevel;

  // Update daily XP
  newDailyXp += xpAmount;

  // Build update operations
  const updateOps = {
    $set: {
      xp: newXp,
      level: newLevelInfo.level,
      dailyXp: newDailyXp,
      dailyXpDate: today,
    },
  };

  // Check for new badges
  const completedCourses = (userDoc.courses || []).filter((c) => c.completed).length;
  const stats = {
    totalLessonsCompleted: (userDoc.courses || []).reduce(
      (sum, c) => sum + (c.completedLessons?.length || 0), 0
    ),
    completedCourses,
    totalQuizzesCompleted: 0,
    perfectQuizzes: 0,
    flashcardsReviewed: 0,
  };

  const newBadges = checkBadges({ ...userDoc, xp: newXp, level: newLevelInfo.level, dailyXp: newDailyXp }, stats);

  if (newBadges.length > 0) {
    updateOps.$push = {
      achievements: { $each: newBadges },
    };
  }

  await db.collection("users").updateOne({ _id: user._id }, updateOps);

  return NextResponse.json({
    success: true,
    xpAwarded: xpAmount,
    action,
    totalXp: newXp,
    level: newLevelInfo.level,
    currentXp: newLevelInfo.currentXp,
    nextLevelXp: newLevelInfo.nextLevelXp,
    progress: newLevelInfo.progress,
    levelUp,
    previousLevel: oldLevel,
    newBadges: newBadges.map((b) => ({
      badgeId: b.badgeId,
      name: b.name,
      icon: b.icon,
      rarity: b.rarity,
    })),
    dailyXp: newDailyXp,
  });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const POST = combineMiddleware(withErrorHandling, withAuth)(handlePost);
