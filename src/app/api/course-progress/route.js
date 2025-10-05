import { NextResponse } from "next/server";
import { withAuth, withErrorHandling } from "@/lib/middleware";
import connectToMongoose from "@/lib/mongoose";
import User from "@/models/User";

async function updateCourseProgressHandler(request) {
  await connectToMongoose();

  const user = request.user;
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { courseId, progress, completed } = await request.json();

    if (!courseId || typeof progress !== "number" || typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "Missing or invalid parameters: courseId, progress, completed" },
        { status: 400 }
      );
    }

    // Update user's course progress
    await User.updateOne(
      { _id: user._id, "courses.courseId": courseId },
      {
        $set: {
          "courses.$.progress": progress,
          "courses.$.completed": completed,
        },
      }
    );

    return NextResponse.json({ message: "Course progress updated successfully" });
  } catch (error) {
    console.error("Error updating course progress:", error);
    return NextResponse.json({ error: "Failed to update course progress" }, { status: 500 });
  }
}

const authenticatedHandler = withAuth(updateCourseProgressHandler);
const errorHandledHandler = withErrorHandling(authenticatedHandler);

export const POST = errorHandledHandler;
