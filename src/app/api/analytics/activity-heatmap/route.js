import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

async function handleGet(request) {
  const authUser = request.user;
  const { db } = await connectToDatabase();

  // Re-fetch from raw DB for accurate streak/activeDates data
  const user = await db.collection("users").findOne(
    { _id: authUser._id },
    { projection: { streak: 1, courses: 1 } }
  );

  // Use streak activeDates from DB
  const streakObj = user?.streak;
  const activeDates = streakObj?.activeDates || [];

  // Build activity data from activeDates
  const activity = {};
  for (const date of activeDates) {
    activity[date] = { level: 1, count: 1 };
  }

  // Enhance with session data if collection exists
  try {
    const sessions = await db
      .collection("sessions")
      .find({ userId: authUser._id })
      .project({ startTime: 1, duration: 1 })
      .toArray();

    for (const session of sessions) {
      if (session.startTime) {
        const date = new Date(session.startTime).toISOString().split("T")[0];
        if (!activity[date]) {
          activity[date] = { level: 0, count: 0 };
        }
        activity[date].count += 1;
        if (activity[date].count >= 6) activity[date].level = 3;
        else if (activity[date].count >= 3) activity[date].level = 2;
        else activity[date].level = 1;
      }
    }
  } catch {
    // Sessions collection may not exist yet — that's fine
  }

  // Enhance with lesson completions from user courses
  try {
    const courses = user.courses || [];
    for (const enrollment of courses) {
      // Each completed lesson is a learning activity
      const completedLessons = enrollment.completedLessons || [];
      for (const lessonId of completedLessons) {
        // Use lastUpdated as the activity date approximation
        if (enrollment.lastUpdated) {
          const date = new Date(enrollment.lastUpdated).toISOString().split("T")[0];
          if (!activity[date]) {
            activity[date] = { level: 0, count: 0 };
          }
          activity[date].count += 1;
          if (activity[date].count >= 6) activity[date].level = 3;
          else if (activity[date].count >= 3) activity[date].level = 2;
          else activity[date].level = 1;
        }
      }
    }
  } catch {
    // Ignore
  }

  return NextResponse.json({
    success: true,
    activity,
    totalActiveDays: activeDates.length,
  });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
