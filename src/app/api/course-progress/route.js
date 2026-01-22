// src/app/api/course-progress/route.js

import { NextResponse } from "next/server";
import { withAuth, withErrorHandling } from "@/lib/middleware";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { checkCourseAccess } from "@/lib/planMiddleware";

async function handlePost(request) {
  const user = request.user;
  const { db } = await connectToDatabase();

  try {
    const body = await request.json();
    const { courseId, progress, completed, lessonId } = body;

    // === Plan Validation ===
    const access = await checkCourseAccess(user._id, courseId);

    if (!access.hasAccess) {
      return NextResponse.json(
        {
          error: "Access denied",
          message: access.reason,
          requiredTier: access.requiredTier,
          code: "INSUFFICIENT_PLAN"
        },
        { status: 403 }
      );
    }

    // === Input Validation ===
    if (!courseId || typeof courseId !== "string" || courseId.length < 12) {
      return NextResponse.json(
        { error: "Invalid or missing courseId", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    if (typeof progress !== "number" || progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: "Progress must be a number between 0 and 100", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    if (typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "Completed must be a boolean", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    // Atomic Update
    const result = await db.collection("users").updateOne(
      { _id: user._id, "courses.courseId": courseId },
      {
        $set: {
          "courses.$.progress": Math.round(progress),
          "courses.$.completed": completed,
          "courses.$.lastUpdated": new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $push: {
            courses: {
              courseId,
              progress: Math.round(progress),
              completed,
              startedAt: new Date(),
              lastUpdated: new Date(),
            },
          },
        }
      );
    }

    // If client provided a lessonId, also persist per-lesson completion into the library document
    if (lessonId && typeof lessonId === "string") {
      try {
        const courseObjId = new ObjectId(courseId);
        const [modNum, lessonNum] = String(lessonId).split("-");
        const moduleId = parseInt(modNum, 10);

        const isLessonDone =
          typeof body.isLessonCompleted === "boolean"
            ? body.isLessonCompleted
            : completed;

        if (!Number.isNaN(moduleId)) {
          await db.collection("library").updateOne(
            { _id: courseObjId, userId: user._id },
            {
              $set: {
                "modules.$[m].lessons.$[l].completed": isLessonDone,
                lastAccessed: new Date(),
              },
            },
            {
              arrayFilters: [{ "m.id": moduleId }, { "l.id": lessonId }],
            }
          );
        }
      } catch (e) {
        console.error("Lesson progress update error:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Progress saved",
      data: {
        courseId,
        progress: Math.round(progress),
        completed,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Update course progress error:", error);
    throw error;
  }
}

// Apply middleware
export const POST = withErrorHandling(withAuth(handlePost));

