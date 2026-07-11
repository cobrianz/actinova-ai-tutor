import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

// GET - Fetch user's streak data
async function handleGet(request) {
  const user = request.user;
  const { db } = await connectToDatabase();

  const userDoc = await db.collection("users").findOne(
    { _id: user._id },
    { projection: { streak: 1 } }
  );

  const streak = userDoc?.streak || { current: 0, longest: 0, lastActiveDate: null, activeDates: [] };

  return NextResponse.json({ success: true, streak });
}

// POST - Update streak (called on lesson completion or daily login)
async function handlePost(request) {
  const user = request.user;
  const { db } = await connectToDatabase();
  const body = await request.json();
  const { action = "activity" } = body;

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

  const userDoc = await db.collection("users").findOne(
    { _id: user._id },
    { projection: { streak: 1 } }
  );

  const streak = userDoc?.streak || { current: 0, longest: 0, lastActiveDate: null, activeDates: [] };
  const lastActive = streak.lastActiveDate;

  let newStreak = streak.current;
  let shouldUpdate = false;

  // Check if user was active today already
  if (lastActive === todayStr) {
    // Already active today, no change
    return NextResponse.json({ success: true, streak, updated: false });
  }

  // Check if yesterday was the last active day (consecutive)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (lastActive === yesterdayStr) {
    // Consecutive day - increment streak
    newStreak = streak.current + 1;
    shouldUpdate = true;
  } else if (!lastActive) {
    // First activity ever
    newStreak = 1;
    shouldUpdate = true;
  } else {
    // Streak broken - reset to 1
    newStreak = 1;
    shouldUpdate = true;
  }

  if (shouldUpdate) {
    const longest = Math.max(newStreak, streak.longest);
    
    // Add today to activeDates if not already there (keep last 365 days)
    const activeDates = [...new Set([...(streak.activeDates || []), todayStr])];
    
    // Trim to last 365 days
    const cutoff = new Date(today);
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    const trimmedDates = activeDates.filter(d => d >= cutoffStr);

    const updatedStreak = {
      current: newStreak,
      longest,
      lastActiveDate: todayStr,
      activeDates: trimmedDates,
    };

    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { streak: updatedStreak } }
    );

    return NextResponse.json({ success: true, streak: updatedStreak, updated: true });
  }

  return NextResponse.json({ success: true, streak, updated: false });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const POST = combineMiddleware(withErrorHandling, withAuth)(handlePost);
