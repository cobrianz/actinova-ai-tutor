import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import StudentProgress from "@/models/StudentProgress";

async function handlePut(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }

  const isInstructor = classroom.instructorId.toString() === user._id.toString();
  const body = await request.json();
  const { assignmentId, studentId, progress, status, score, feedback, timeSpentMinutes } = body;

  if (!assignmentId) {
    return NextResponse.json(
      { error: "Assignment ID is required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const filter = {
    assignmentId,
    classroomId: id,
    studentId: isInstructor && studentId ? studentId : user._id,
  };

  const update = {
    lastAccessedAt: new Date(),
  };

  if (progress !== undefined) update.progress = Math.min(100, Math.max(0, progress));
  if (status !== undefined) {
    update.status = status;
    if (status === "completed") {
      update.completedAt = new Date();
      update.progress = 100;
    }
  }
  if (score !== undefined && isInstructor) {
    update.score = score;
    update.gradedBy = user._id;
    update.gradedAt = new Date();
  }
  if (feedback !== undefined && isInstructor) {
    update.feedback = feedback;
  }
  if (timeSpentMinutes !== undefined) {
    update.$inc = { timeSpentMinutes };
  }

  const doc = await StudentProgress.findOneAndUpdate(filter, update, {
    new: true,
    upsert: !isInstructor,
  }).lean();

  if (!doc) {
    return NextResponse.json(
      { error: "Progress record not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    progress: {
      id: doc._id.toString(),
      status: doc.status,
      progress: doc.progress,
      score: doc.score,
      feedback: doc.feedback,
      completedAt: doc.completedAt,
      submittedAt: doc.submittedAt,
      submissionText: doc.submissionText,
      submissionFiles: doc.submissionFiles,
      timeSpentMinutes: doc.timeSpentMinutes,
    },
  });
}

export const PUT = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePut);
export const dynamic = "force-dynamic";
