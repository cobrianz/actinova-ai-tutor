import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import Enrollment from "@/models/Enrollment";
import Test from "@/models/Quiz";
import { ObjectId } from "mongodb";

const handler = combineMiddleware(withErrorHandling, withCsrf, withAuth);

async function handleGet(request, { params }) {
  const user = request.user;
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get("contentId");

  if (!contentId) {
    return NextResponse.json({ error: "contentId is required" }, { status: 400 });
  }

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isInstructor = classroom.instructorId?.toString() === user._id?.toString();
  if (!isInstructor) {
    const enrollment = await Enrollment.findOne({ classroomId: id, studentId: user._id, status: "active" }).lean();
    if (!enrollment) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  const forkEntry = classroom.forkedContent?.find(
    (fc) => fc.contentId?.toString() === contentId && fc.contentType === "quiz"
  );
  if (!forkEntry) return NextResponse.json({ error: "Forked quiz not found" }, { status: 404 });

  if (!isInstructor && forkEntry.unlocked === false) {
    return NextResponse.json({ error: "Quiz is locked" }, { status: 403 });
  }

  const quiz = await Test.findById(contentId).lean();
  if (!quiz) return NextResponse.json({ error: "Quiz not found in library" }, { status: 404 });

  return NextResponse.json({
    _id: quiz._id,
    title: quiz.title,
    course: quiz.course,
    questions: quiz.questions,
  });
}

export const GET = handler(handleGet);
