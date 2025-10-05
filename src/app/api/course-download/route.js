import { NextResponse } from "next/server";
import { withAuth, withErrorHandling } from "@/lib/middleware";
import connectToMongoose from "@/lib/mongoose";
import Course from "@/models/Course";

async function downloadCourseHandler(request) {
  await connectToMongoose();

  const user = request.user;
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId parameter" }, { status: 400 });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Prepare course content as a downloadable JSON file
    const courseContent = JSON.stringify(course, null, 2);

    return new NextResponse(courseContent, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${course.title.replace(/\s+/g, "_")}.json"`,
      },
    });
  } catch (error) {
    console.error("Error downloading course:", error);
    return NextResponse.json({ error: "Failed to download course" }, { status: 500 });
  }
}

const authenticatedHandler = withAuth(downloadCourseHandler);
const errorHandledHandler = withErrorHandling(authenticatedHandler);

export const POST = errorHandledHandler;
