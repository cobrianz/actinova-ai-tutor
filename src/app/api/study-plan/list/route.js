export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

async function handleGet(request) {
  const user = request.user;
  const { db } = await connectToDatabase();

  const plans = await db
    .collection("library")
    .find({
      userId: new ObjectId(user._id),
      format: "study_plan",
    })
    .sort({ createdAt: -1 })
    .toArray();

  const items = plans.map((plan) => {
    let totalEstimatedMinutes = 0;
    let completedEstimatedMinutes = 0;
    for (const week of plan.weeks || []) {
      for (const day of week.days || []) {
        for (const task of day.tasks || []) {
          const mins = task.estimatedMinutes || 0;
          totalEstimatedMinutes += mins;
          if (task.completed) completedEstimatedMinutes += mins;
        }
      }
    }
    return {
      _id: plan._id.toString(),
      title: plan.title,
      topic: plan.originalTopic || plan.topic,
      difficulty: plan.difficulty,
      durationWeeks: plan.durationWeeks,
      overview: plan.overview,
      progress: plan.progress || 0,
      totalTasks: plan.totalTasks || 0,
      completedTasks: plan.completedTasks || 0,
      completed: plan.completed || false,
      createdAt: plan.createdAt,
      lastAccessed: plan.lastAccessed,
      selectedCourseNames: plan.selectedCourseNames || [],
      totalEstimatedMinutes,
      completedEstimatedMinutes,
    };
  });

  return NextResponse.json({ success: true, items });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
