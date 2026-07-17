import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import Enrollment from "@/models/Enrollment";
import Assignment from "@/models/Assignment";
import StudentProgress from "@/models/StudentProgress";
import User from "@/models/User";

async function handleGet(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }

  if (classroom.instructorId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const enrollments = await Enrollment.find({
    classroomId: id,
    status: "active",
  }).lean();

  const studentIds = enrollments.map((e) => e.studentId);
  const students = await User.find({ _id: { $in: studentIds } })
    .select("name email")
    .lean();

  const assignments = await Assignment.find({
    classroomId: id,
    isActive: true,
  }).lean();

  const progress = await StudentProgress.find({ classroomId: id }).lean();

  const studentData = students.map((s) => {
    const studentEnrollment = enrollments.find(
      (e) => e.studentId.toString() === s._id.toString()
    );
    const studentProgress = progress.filter(
      (p) => p.studentId.toString() === s._id.toString()
    );

    const totalAssignments = studentProgress.length;
    const completed = studentProgress.filter(
      (p) => p.status === "completed"
    ).length;
    const totalTime = studentProgress.reduce(
      (sum, p) => sum + (p.timeSpentMinutes || 0),
      0
    );
    const avgProgress =
      totalAssignments > 0
        ? Math.round(
            studentProgress.reduce((sum, p) => sum + (p.progress || 0), 0) /
              totalAssignments
          )
        : 0;

    return {
      id: s._id.toString(),
      name: s.name,
      email: s.email,
      enrolledAt: studentEnrollment.joinedAt,
      totalAssignments,
      completed,
      avgProgress,
      totalTimeMinutes: totalTime,
      progress: studentProgress.map((p) => ({
        assignmentId: p.assignmentId.toString(),
        status: p.status,
        progress: p.progress,
        score: p.score,
        completedAt: p.completedAt,
      })),
    };
  });

  const totalStudents = studentData.length;
  const activeStudents = studentData.filter(
    (s) => s.completed > 0
  ).length;
  const avgCompletion =
    totalStudents > 0
      ? Math.round(
          studentData.reduce((sum, s) => sum + s.avgProgress, 0) / totalStudents
        )
      : 0;

  return NextResponse.json({
    success: true,
    students: studentData,
    stats: { totalStudents, activeStudents, avgCompletion },
  });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const dynamic = "force-dynamic";
