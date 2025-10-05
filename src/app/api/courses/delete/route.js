import { NextResponse } from "next/server"
import { withAuth, withErrorHandling } from "@/lib/middleware"
import connectToMongoose from "@/lib/mongoose"
import Course from "@/models/Course"
import User from "@/models/User"

async function deleteCourseHandler(request) {
  await connectToMongoose()

  const user = request.user
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  try {
    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    // Find the course and verify ownership
    const course = await Course.findOne({ _id: courseId, createdBy: user._id })

    if (!course) {
      return NextResponse.json({ error: "Course not found or access denied" }, { status: 404 })
    }

    // Remove course from user's courses array
    await User.updateOne(
      { _id: user._id },
      { $pull: { courses: { courseId: courseId } } }
    )

    // Delete the course document
    await Course.findByIdAndDelete(courseId)

    return NextResponse.json({
      message: "Course deleted successfully",
      courseId: courseId
    })
  } catch (error) {
    console.error("Error deleting course:", error)
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 })
  }
}

const authenticatedHandler = withAuth(deleteCourseHandler)
const errorHandledHandler = withErrorHandling(authenticatedHandler)

export const DELETE = errorHandledHandler