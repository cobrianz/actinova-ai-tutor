import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import Assignment from "@/models/Assignment";
import StudentProgress from "@/models/StudentProgress";
import Enrollment from "@/models/Enrollment";

async function handlePost(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }

  const isEnrolled = await Enrollment.findOne({
    classroomId: id,
    studentId: user._id,
    status: "active",
  }).lean();
  if (!isEnrolled) {
    return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
  }

  const body = await request.json();
  const { assignmentId, text, score } = body;

  if (!assignmentId) {
    return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });
  }

  if (!text?.trim()) {
    return NextResponse.json({ error: "Please provide submission text" }, { status: 400 });
  }

  const assignment = await Assignment.findById(assignmentId).lean();
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  if (!assignment.allowLateSubmissions && assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
    return NextResponse.json({ error: "Late submissions are not allowed" }, { status: 400 });
  }

  const filter = { assignmentId, classroomId: id, studentId: user._id };
  const update = {
    status: "completed",
    progress: 100,
    completedAt: new Date(),
    submissionText: text.trim(),
    submittedAt: new Date(),
    lastAccessedAt: new Date(),
  };
  if (score != null) update.score = Number(score);

  const doc = await StudentProgress.findOneAndUpdate(filter, update, {
    new: true,
    upsert: true,
  }).lean();

  return NextResponse.json({
    success: true,
    progress: {
      id: doc._id.toString(),
      assignmentId: assignmentId.toString(),
      status: doc.status,
      progress: doc.progress,
      score: doc.score,
      completedAt: doc.completedAt,
      submissionText: doc.submissionText,
      submittedAt: doc.submittedAt,
    },
  });
}

export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
export const dynamic = "force-dynamic";
