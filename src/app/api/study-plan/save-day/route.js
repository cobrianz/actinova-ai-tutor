export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

async function handlePut(request) {
  const user = request.user;

  try {
    const body = await request.json();
    const { planId, weekIndex, dayIndex, tasks } = body;

    if (!planId || !ObjectId.isValid(planId)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    if (weekIndex == null || dayIndex == null) {
      return NextResponse.json({ error: "weekIndex and dayIndex are required" }, { status: 400 });
    }

    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: "tasks must be an array" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const plan = await db.collection("library").findOne({
      _id: new ObjectId(planId),
      userId: new ObjectId(user._id),
      format: "study_plan",
    });

    if (!plan) {
      return NextResponse.json({ error: "Study plan not found" }, { status: 404 });
    }

    const weeks = plan.weeks || [];
    if (weekIndex >= weeks.length) {
      return NextResponse.json({ error: "Week not found" }, { status: 404 });
    }

    const days = weeks[weekIndex].days || [];
    if (dayIndex >= days.length) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    // Normalize tasks — preserve completed status from existing tasks
    const existingTasks = days[dayIndex].tasks || [];
    const normalizedTasks = tasks.map((task, i) => {
      const existing = existingTasks.find(
        (et) => et.title === task.title && et.type === task.type
      );
      return {
        type: task.type || "practice",
        title: task.title || "",
        description: task.description || "",
        estimatedMinutes: task.estimatedMinutes || 30,
        relatedCourseTitle: task.relatedCourseTitle || null,
        courseId: task.courseId || null,
        moduleId: task.moduleId || null,
        lessonIndex: task.lessonIndex ?? null,
        relatedCourseTopic: task.relatedCourseTopic || null,
        completed: existing ? existing.completed : false,
      };
    });

    // Update the day's tasks
    const updatePath = `weeks.${weekIndex}.days.${dayIndex}.tasks`;
    await db.collection("library").updateOne(
      { _id: new ObjectId(planId) },
      { $set: { [updatePath]: normalizedTasks, lastAccessed: new Date() } }
    );

    // Recalculate totals
    const updatedPlan = await db.collection("library").findOne({ _id: new ObjectId(planId) });
    let completedTasks = 0;
    let totalTasks = 0;

    for (const week of updatedPlan.weeks || []) {
      for (const day of week.days || []) {
        for (const task of day.tasks || []) {
          totalTasks++;
          if (task.completed) completedTasks++;
        }
      }
    }

    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const isFullyComplete = completedTasks === totalTasks && totalTasks > 0;

    await db.collection("library").updateOne(
      { _id: new ObjectId(planId) },
      {
        $set: {
          completedTasks,
          totalTasks,
          progress,
          completed: isFullyComplete,
          lastAccessed: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      tasks: normalizedTasks,
      completedTasks,
      totalTasks,
      progress,
      completed: isFullyComplete,
    });
  } catch (error) {
    console.error("Failed to save day tasks:", error);
    throw error;
  }
}

export const PUT = combineMiddleware(withErrorHandling, withAuth)(handlePut);
