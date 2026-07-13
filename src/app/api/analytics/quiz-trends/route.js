import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

async function handleGet(request) {
  const user = request.user;
  const { db } = await connectToDatabase();

  const quizzes = await db
    .collection("tests")
    .find({ "performances.userId": user._id })
    .project({ title: 1, performances: 1 })
    .toArray();

  const trends = [];

  for (const quiz of quizzes) {
    const userPerfs = (quiz.performances || []).filter(
      (p) => p.userId?.toString() === user._id.toString()
    );

    for (const perf of userPerfs) {
      trends.push({
        title: quiz.title,
        score: Math.round(perf.percentage || 0),
        date: perf.completedAt
          ? new Date(perf.completedAt).toISOString().split("T")[0]
          : null,
        completedAt: perf.completedAt,
      });
    }
  }

  // Sort by date descending
  trends.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  return NextResponse.json({
    success: true,
    trends,
    totalAttempts: trends.length,
    averageScore:
      trends.length > 0
        ? Math.round(
            trends.reduce((sum, t) => sum + t.score, 0) / trends.length
          )
        : 0,
  });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
