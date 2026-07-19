import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";

/**
 * GET /api/classrooms/[id]/participants
 * Returns a list of participants (instructor + enrolled students) visible to
 * any member of the classroom. Students only see names; instructors see emails too.
 */
async function handleGet(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }

  const isInstructor = classroom.instructorId.toString() === user._id.toString();

  // Verify the requester is either the instructor or an active student
  if (!isInstructor) {
    const enrollment = await Enrollment.findOne({
      classroomId: id,
      studentId: user._id,
      status: "active",
    }).lean();
    if (!enrollment) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  // Fetch all active enrolled students
  const enrollments = await Enrollment.find({
    classroomId: id,
    status: "active",
  }).lean();

  const studentIds = enrollments.map((e) => e.studentId);

  // Instructors see name + email, students only see name
  const selectFields = isInstructor ? "name email" : "name";
  const students = await User.find({ _id: { $in: studentIds } })
    .select(selectFields)
    .lean();

  // Fetch instructor name
  const instructor = await User.findById(classroom.instructorId)
    .select("name email")
    .lean();

  return NextResponse.json({
    success: true,
    instructor: instructor
      ? { id: instructor._id.toString(), name: instructor.name, role: "instructor" }
      : null,
    students: students.map((s) => ({
      id: s._id.toString(),
      name: s.name,
      email: isInstructor ? s.email : undefined,
      role: "student",
    })),
  });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const dynamic = "force-dynamic";
