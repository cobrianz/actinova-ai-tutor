// src/app/api/courses/delete/route.js

import { NextResponse } from "next/server";
import { withAuth, withErrorHandling } from "@/lib/middleware";
import { connectToDatabase } from "@/lib/mongodb";
import Course from "@/models/Course";
import User from "@/models/User";

async function handleDelete(request) {
  await connectToDatabase();

  const user = request.user;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { courseId } = await request.json();

    // === Validate Input ===
    if (!courseId || typeof courseId !== "string" || courseId.length < 12) {
      return NextResponse.json(
        { error: "Valid courseId is required" },
        { status: 400 }
      );
    }

    // === Find and verify ownership ===
    const course = await Course.findOne({
      _id: courseId,
      createdBy: user._id,
    }).lean();

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    // === Atomic Deletion (both Course doc and User reference) ===
    const session = await Course.startSession();
    await session.withTransaction(async () => {
      // 1. Delete the course document
      await Course.deleteOne({ _id: courseId }).session(session);

      // 2. Remove from user's courses array (if stored there)
      await User.updateOne(
        { _id: user._id },
        { $pull: { courses: { courseId } } }
      ).session(session);
    });
    await session.endSession();

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully",
      courseId,
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Course deletion failed:", {
      userId: user._id,
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: "Failed to delete course. Please try again." },
      { status: 500 }
    );
  }
}

// Apply middleware
const handler = withAuth(handleDelete);
export const DELETE = withErrorHandling(handler);
