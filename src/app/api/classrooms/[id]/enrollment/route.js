import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import Enrollment from "@/models/Enrollment";

async function handleDelete(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }

  const isInstructor = classroom.instructorId.toString() === user._id.toString();
  const isLeavingSelf = !studentId || studentId === user._id.toString();

  if (!isInstructor && !isLeavingSelf) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const targetStudentId = isInstructor && studentId ? studentId : user._id.toString();

  const enrollment = await Enrollment.findOne({
    classroomId: id,
    studentId: targetStudentId,
    status: "active",
  });

  if (!enrollment) {
    return NextResponse.json(
      { error: "Student not enrolled" },
      { status: 404 }
    );
  }

  enrollment.status = isInstructor && targetStudentId !== user._id.toString() ? "removed" : "left";
  await enrollment.save();

  return NextResponse.json({ success: true });
}

export const DELETE = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handleDelete);
export const dynamic = "force-dynamic";
