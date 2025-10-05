import { NextResponse } from "next/server"
import { withAuth, withErrorHandling } from "@/lib/middleware"
import connectToMongoose from "@/lib/mongoose"
import User from "@/models/User"
import Course from "@/models/Course"

async function getUserCoursesHandler(request) {
  await connectToMongoose()

  const user = request.user
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  try {
    // Find user and populate courses
    const userWithCourses = await User.findById(user._id).populate({
      path: 'courses.courseId',
      model: Course
    })

    if (!userWithCourses) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Format courses data
    const courses = userWithCourses.courses.map(userCourse => ({
      _id: userCourse.courseId._id,
      title: userCourse.courseId.title,
      level: userCourse.courseId.level,
      totalModules: userCourse.courseId.totalModules,
      totalLessons: userCourse.courseId.totalLessons,
      progress: userCourse.progress,
      completed: userCourse.completed,
      createdAt: userCourse.courseId.createdAt,
      enrolledAt: userCourse.enrolledAt
    }))

    return NextResponse.json(courses)
  } catch (error) {
    console.error("Error fetching user courses:", error)
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}

const authenticatedHandler = withAuth(getUserCoursesHandler)
const errorHandledHandler = withErrorHandling(authenticatedHandler)

export const GET = errorHandledHandler