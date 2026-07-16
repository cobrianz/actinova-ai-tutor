import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { buildAdaptiveInsights } from "@/lib/adaptiveInsights";

function getStreakCurrent(streak) {
  if (!streak) return 0;
  if (typeof streak === "number") return streak;
  return streak.current || 0;
}

function getStreakLongest(streak) {
  if (!streak) return 0;
  if (typeof streak === "number") return streak;
  return streak.longest || 0;
}


async function handleGet(request) {
  const authUser = request.user;
  const { db } = await connectToDatabase();
  
  const url = new URL(request.url);
  const startParam = url.searchParams.get("start");
  const endParam = url.searchParams.get("end");
  const startDate = startParam ? new Date(startParam) : null;
  const endDate = endParam ? new Date(endParam) : null;

  // Re-fetch from raw DB — request.user from Mongoose lean() may be missing
  // gamification fields for users created via the signup route (raw MongoDB insert)
  const user = await db.collection("users").findOne(
    { _id: authUser._id },
    {
      projection: {
        courses: 1, streak: 1, xp: 1, level: 1, achievements: 1,
        dailyXp: 1, dailyXpDate: 1, goals: 1,
      },
    }
  );

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const streakCurrent = getStreakCurrent(user.streak);
  const streakLongest = getStreakLongest(user.streak);
  const courses = user.courses || [];

  const enrolledCompletedCourses = courses.filter((c) => c.completed).length;
  const totalLessonsCompleted = courses.reduce(
    (sum, c) => sum + (c.completedLessons?.length || 0), 0
  );

  // Fetch quiz stats, flashcard stats, course details, sessions, reports, and chats in parallel
  const [
    quizzes,
    cardSets,
    sessions,
    totalReports,
    totalChats,
  ] = await Promise.all([
    // Quiz stats — find tests where this user has performances
    db.collection("tests")
      .find({}, { projection: { performances: 1, title: 1 } })
      .toArray()
      .catch(() => []),

    // Flashcard stats — try both ObjectId and string userId
    db.collection("cardSets")
      .find({ $or: [{ userId: user._id }, { userId: user._id.toString() }] }, { projection: { cards: 1 } })
      .toArray()
      .catch(() => []),

    // Study sessions (may not exist yet)
    db.collection("sessions")
      .find({ userId: user._id }, { projection: { duration: 1 } })
      .toArray()
      .catch(() => []),

    // Reports count
    db.collection("reports")
      .countDocuments({ userId: user._id })
      .catch(() => 0),

    // Chat sessions count
    db.collection("chats")
      .countDocuments({ userId: user._id })
      .catch(() => 0),
  ]);

  // Process quiz data
  let totalQuizzes = 0;
  let totalScore = 0;
  const quizTrends = [];
  const userIdStr = user._id.toString();

  for (const quiz of quizzes) {
    const userPerfs = (quiz.performances || []).filter((p) => {
      const pUserId = p.userId;
      if (!pUserId) return false;
      const pIdStr = typeof pUserId === "string" ? pUserId : pUserId?.toString?.() || "";
      if (pIdStr !== userIdStr) return false;
      
      if (p.completedAt && (startDate || endDate)) {
        const d = new Date(p.completedAt);
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
      }
      return true;
    });

    totalQuizzes += userPerfs.length;
    for (const perf of userPerfs) {
      const percentage = Number(perf.percentage || 0);
      totalScore += percentage;
      quizTrends.push({
        title: quiz.title || "Quiz",
        score: Math.round(percentage),
        date: perf.completedAt
          ? new Date(perf.completedAt).toLocaleDateString()
          : "Unknown",
        completedAt: perf.completedAt,
        course: quiz.course || "",
      });
    }
  }

  quizTrends.sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
  const averageQuizScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;

  // Process flashcard data
  let totalFlashcards = 0;
  let masteredFlashcards = 0;
  for (const set of cardSets) {
    const cards = set.cards || [];
    totalFlashcards += cards.length;
    masteredFlashcards += cards.filter(
      (c) => (c.srs?.interval || 0) >= 30
    ).length;
  }

  // Course progress — use same query as Library API (userId match on library collection)
  const userObjId = user._id;
  let libDocs = [];
  libDocs = await db.collection("library")
    .find({ $or: [{ userId: userObjId }, { enrolled: userObjId }] })
    .project({ title: 1, topic: 1, originalTopic: 1, totalLessons: 1, modules: 1, userId: 1, difficulty: 1, level: 1 })
    .toArray()
    .catch(() => []);

  // Build progress map from user.courses (same as Library API progressMap)
  const progressMap = new Map();
  courses.forEach((c) => {
    progressMap.set(String(c.courseId), {
      progress: c.progress || 0,
      completed: c.completed || false,
      completedLessons: new Set(c.completedLessons || []),
    });
  });

  // Derive courseProgress using Library API's logic
  const courseProgressList = libDocs.map((c) => {
    const cp = progressMap.get(String(c._id)) || { progress: 0, completed: false, completedLessons: new Set() };

    let trueCompletedCount = 0;
    let trueTotalLessons = 0;
    const modules = c.modules || [];
    modules.forEach((module, moduleIndex) => {
      if (module.lessons) {
        trueTotalLessons += module.lessons.length;
        module.lessons.forEach((lesson, lessonIndex) => {
          const lessonId = lesson.id || `${module.id || moduleIndex + 1}-${lessonIndex}`;
          if (lesson.completed || cp.completedLessons.has(lessonId)) {
            trueCompletedCount++;
          }
        });
      }
    });

    const dynamicProgress = trueTotalLessons > 0 ? Math.round((trueCompletedCount / trueTotalLessons) * 100) : 0;
    const calculatedProgress = Math.max(cp.progress, dynamicProgress);

    return {
      id: String(c._id),
      title: c.title || c.topic || c.originalTopic || "Course",
      progress: calculatedProgress,
      completedLessons: trueCompletedCount || cp.completedLessons.size,
      totalLessons: c.totalLessons || trueTotalLessons || 0,
      completed: cp.completed || calculatedProgress >= 100,
      difficulty: c.difficulty || c.level || "beginner",
    };
  });

  const totalCourses = courseProgressList.length;
  const completedCourses = courseProgressList.filter((c) => c.completed).length;
  const courseProgress = courseProgressList.slice(0, 6);

  // Study time
  const totalStudyMinutes = Math.round(
    sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60000
  );

  // Build recent activity feed
  const recentActivity = [];

  const isWithinRange = (dateStr) => {
    if (!startDate && !endDate) return true;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  };

  // Add quiz activity
  for (const qt of quizTrends) {
    if (recentActivity.length >= 3) break;
    if (!isWithinRange(qt.completedAt)) continue;
    recentActivity.push({
      type: "quiz_taken",
      description: `Scored ${qt.score}% on "${qt.title}"`,
      timeAgo: formatTimeAgo(qt.completedAt),
      date: qt.completedAt ? new Date(qt.completedAt).toISOString() : null,
    });
  }

  // Add streak info
  if (streakCurrent > 0) {
    recentActivity.push({
      type: "xp_earned",
      description: `${streakCurrent}-day learning streak active`,
      timeAgo: "Now",
      date: new Date().toISOString(),
    });
  }

  // Add course activity
  for (const c of courses.filter((c) => c.completed)) {
    if (recentActivity.filter(a => a.type === 'course_completed').length >= 2) break;
    if (!isWithinRange(c.completedAt)) continue;
    recentActivity.push({
      type: "course_completed",
      description: `Completed a course`,
      timeAgo: c.completedAt ? formatTimeAgo(c.completedAt) : "Recently",
      date: c.completedAt ? new Date(c.completedAt).toISOString() : null,
    });
  }

  recentActivity.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  const adaptiveInsights = buildAdaptiveInsights({
    summary: {
      averageQuizScore,
      masteredFlashcards,
      totalFlashcards,
    },
    courseProgress,
    quizTrends,
    user: {
      goals: user.goals || [],
    },
  });

  return NextResponse.json({
    success: true,
    summary: {
      totalCourses: totalCourses,
      completedCourses,
      inProgressCourses: Math.max(0, totalCourses - completedCourses),
      totalLessonsCompleted,
      totalQuizzes,
      averageQuizScore,
      totalFlashcards,
      masteredFlashcards,
      totalReports,
      totalChats,
      totalXp: user.xp || 0,
      level: user.level || 1,
      streakCurrent,
      streakLongest,
      totalStudyMinutes,
      achievementsCount: user.achievements?.length || 0,
    },
    courseProgress,
    quizTrends: quizTrends.slice(0, 10),
    recentActivity: recentActivity.slice(0, 10),
    adaptiveInsights,
  });
}

function formatTimeAgo(date) {
  if (!date) return "Unknown";
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
