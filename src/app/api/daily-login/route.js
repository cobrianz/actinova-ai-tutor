import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth, withErrorHandling, combineMiddleware } from '@/lib/middleware';
import { calculateLevel } from '@/lib/gamification';

async function handlePost(request) {
  const authUser = request.user;
  const { db } = await connectToDatabase();

  const user = await db.collection("users").findOne(
    { _id: authUser._id },
    { projection: { xp: 1, level: 1, lastLoginBonus: 1, dailyLoginStreak: 1 } }
  );

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const today = new Date().toISOString().split("T")[0];
  
  if (user.lastLoginBonus === today) {
    return NextResponse.json({ alreadyClaimed: true });
  }

  // Calculate streak logic
  let newStreak = 1;
  const lastBonusDate = user.lastLoginBonus ? new Date(user.lastLoginBonus) : null;
  
  if (lastBonusDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    
    if (user.lastLoginBonus === yesterdayStr) {
      newStreak = (user.dailyLoginStreak || 0) + 1;
    }
  }

  // Calculate XP
  let xpAwarded = 5;
  if (newStreak >= 3 && newStreak <= 6) xpAwarded = 10;
  if (newStreak >= 7 && newStreak <= 13) xpAwarded = 20;
  if (newStreak >= 14) xpAwarded = 30;

  const oldXp = user.xp || 0;
  const newXp = oldXp + xpAwarded;
  const oldLevel = calculateLevel(oldXp).level;
  const newLevelInfo = calculateLevel(newXp);
  const levelUp = newLevelInfo.level > oldLevel;

  await db.collection("users").updateOne(
    { _id: user._id },
    {
      $set: {
        xp: newXp,
        level: newLevelInfo.level,
        lastLoginBonus: today,
        dailyLoginStreak: newStreak,
      }
    }
  );

  // Send notification
  await db.collection("notifications").insertOne({
    userId: user._id,
    type: "daily_bonus",
    title: "Daily Login Bonus!",
    message: `+${xpAwarded} XP for logging in today (Streak: ${newStreak})`,
    read: false,
    createdAt: new Date(),
    icon: "zap"
  });

  return NextResponse.json({
    claimed: true,
    xpAwarded,
    streak: newStreak,
    newTotalXp: newXp,
    levelUp,
    newLevel: newLevelInfo.level
  });
}

export const POST = combineMiddleware(withErrorHandling, withAuth)(handlePost);
