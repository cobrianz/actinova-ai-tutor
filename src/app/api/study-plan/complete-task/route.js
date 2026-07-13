export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

async function handlePatch(request) {
  const user = request.user;

  try {
    const body = await request.json();
    const { studyPlanId, weekNumber, dayIndex, taskIndex, completed = true } = body;

    if (!studyPlanId || !ObjectId.isValid(studyPlanId)) {
      return NextResponse.json({ error: "Invalid study plan ID" }, { status: 400 });
    }

    if (weekNumber == null || dayIndex == null || taskIndex == null) {
      return NextResponse.json(
        { error: "weekNumber, dayIndex, and taskIndex are required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const plan = await db.collection("library").findOne({
      _id: new ObjectId(studyPlanId),
      userId: new ObjectId(user._id),
      format: "study_plan",
    });

    if (!plan) {
      return NextResponse.json({ error: "Study plan not found" }, { status: 404 });
    }

    // Find and update the specific task
    const weeks = plan.weeks || [];
    const weekIdx = weeks.findIndex((w) => w.weekNumber === weekNumber);

    if (weekIdx === -1) {
      return NextResponse.json({ error: "Week not found" }, { status: 404 });
    }

    const days = weeks[weekIdx].days || [];
    if (dayIndex < 0 || dayIndex >= days.length) {
      return NextResponse.json({ error: "Invalid day index" }, { status: 404 });
    }

    const tasks = days[dayIndex].tasks || [];
    if (taskIndex < 0 || taskIndex >= tasks.length) {
      return NextResponse.json({ error: "Invalid task index" }, { status: 404 });
    }

    // Update the task completion status using positional operators
    const updatePath = `weeks.${weekIdx}.days.${dayIndex}.tasks.${taskIndex}.completed`;
    await db.collection("library").updateOne(
      { _id: new ObjectId(studyPlanId) },
      { $set: { [updatePath]: completed, lastAccessed: new Date() } }
    );

    // If this is a lesson task with a courseId, sync to course progress
    const toggledTask = tasks[taskIndex];
    if (toggledTask.type === "lesson" && toggledTask.courseId && ObjectId.isValid(toggledTask.courseId)) {
      try {
        const lessonId = `${toggledTask.moduleId}-${toggledTask.lessonIndex}`;
        const courseObjId = new ObjectId(toggledTask.courseId);

        if (completed) {
          // Add lesson to course completedLessons
          await db.collection("users").updateOne(
            { _id: new ObjectId(user._id), "courses.courseId": courseObjId },
            { $addToSet: { "courses.$.completedLessons": lessonId } }
          );
          // Also update library document if user owns it
          await db.collection("library").updateOne(
            { _id: courseObjId, userId: new ObjectId(user._id), format: "course" },
            { $set: { [`modules.${toggledTask.moduleId - 1}.lessons.${toggledTask.lessonIndex}.completed`]: true } }
          );
        } else {
          // Remove lesson from course completedLessons
          await db.collection("users").updateOne(
            { _id: new ObjectId(user._id), "courses.courseId": courseObjId },
            { $pull: { "courses.$.completedLessons": lessonId } }
          );
          await db.collection("library").updateOne(
            { _id: courseObjId, userId: new ObjectId(user._id), format: "course" },
            { $set: { [`modules.${toggledTask.moduleId - 1}.lessons.${toggledTask.lessonIndex}.completed`]: false } }
          );
        }

        // Recalculate course progress
        const userDoc = await db.collection("users").findOne(
          { _id: new ObjectId(user._id), "courses.courseId": courseObjId },
          { projection: { "courses.$": 1 } }
        );
        const courseEnrollment = userDoc?.courses?.find((c) => String(c.courseId) === String(courseObjId));
        if (courseEnrollment) {
          const totalLessons = courseEnrollment.totalLessons || 100;
          const completedCount = (courseEnrollment.completedLessons || []).length;
          const courseProgress = Math.round((completedCount / totalLessons) * 100);
          await db.collection("users").updateOne(
            { _id: new ObjectId(user._id), "courses.courseId": courseObjId },
            { $set: { "courses.$.progress": courseProgress } }
          );
        }
      } catch (syncErr) {
        console.error("Failed to sync course progress from study plan:", syncErr);
      }
    }

    // Recalculate total completed tasks and progress
    const updatedPlan = await db.collection("library").findOne({ _id: new ObjectId(studyPlanId) });
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
      { _id: new ObjectId(studyPlanId) },
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
      completedTasks,
      totalTasks,
      progress,
      completed: isFullyComplete,
    });
  } catch (error) {
    console.error("Failed to update task:", error);
    throw error;
  }
}

export const PATCH = combineMiddleware(withErrorHandling, withAuth)(handlePatch);
