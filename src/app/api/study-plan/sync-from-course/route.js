export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

async function handlePost(request) {
  const user = request.user;

  try {
    const body = await request.json();
    const { courseId, moduleId, lessonIndex, completed } = body;

    if (!courseId || moduleId == null || lessonIndex == null) {
      return NextResponse.json(
        { error: "courseId, moduleId, and lessonIndex are required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Find all study plans that reference this course
    const plans = await db
      .collection("library")
      .find({
        userId: new ObjectId(user._id),
        format: "study_plan",
        selectedCourseIds: new ObjectId(courseId),
      })
      .toArray();

    if (plans.length === 0) {
      return NextResponse.json({ success: true, updated: 0 });
    }

    let totalUpdated = 0;

    for (const plan of plans) {
      const weeks = plan.weeks || [];
      let planUpdated = false;

      for (let wi = 0; wi < weeks.length; wi++) {
        for (let di = 0; di < (weeks[wi].days || []).length; di++) {
          for (let ti = 0; ti < (weeks[wi].days[di].tasks || []).length; ti++) {
            const task = weeks[wi].days[di].tasks[ti];
            if (
              task.type === "lesson" &&
              String(task.courseId) === String(courseId) &&
              task.moduleId === moduleId &&
              task.lessonIndex === lessonIndex &&
              task.completed !== completed
            ) {
              const updatePath = `weeks.${wi}.days.${di}.tasks.${ti}.completed`;
              await db.collection("library").updateOne(
                { _id: plan._id },
                { $set: { [updatePath]: completed, lastAccessed: new Date() } }
              );
              planUpdated = true;
              totalUpdated++;
            }
          }
        }
      }

      // Recalculate progress if plan was updated
      if (planUpdated) {
        const updatedPlan = await db.collection("library").findOne({ _id: plan._id });
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
        await db.collection("library").updateOne(
          { _id: plan._id },
          {
            $set: {
              completedTasks,
              totalTasks,
              progress,
              completed: completedTasks === totalTasks && totalTasks > 0,
              lastAccessed: new Date(),
            },
          }
        );
      }
    }

    return NextResponse.json({ success: true, updated: totalUpdated });
  } catch (error) {
    console.error("Failed to sync study plan from course:", error);
    throw error;
  }
}

export const POST = combineMiddleware(withErrorHandling, withAuth)(handlePost);
