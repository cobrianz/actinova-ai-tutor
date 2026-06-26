import { NextResponse } from "next/server";
import Quiz from "@/models/Quiz";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { withAPIRateLimit, trackAPIUsage } from "@/lib/planMiddleware";

async function handleGet(request) {
  const user = request.user;
  await connectToDatabase();
  const quizzes = await Quiz.find({ createdBy: user._id }).sort({ createdAt: -1 });
  return NextResponse.json(quizzes);
}

async function handlePost(request) {
  const user = request.user;
  const body = await request.json();
  await connectToDatabase();

  // Enforce exactly 50 questions per exam
  const questions = body.questions || [];
  if (questions.length !== 50) {
    return NextResponse.json(
      { error: "Each exam must contain exactly 50 questions" },
      { status: 400 }
    );
  }

  const newQuiz = new Quiz({ ...body, questions, createdBy: user._id });
  await newQuiz.save();

  // Increment API Usage
  await trackAPIUsage(user._id, "quiz", { itemType: "exam_generation", creditCost: 25 });

  return NextResponse.json(newQuiz, { status: 201 });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const POST = combineMiddleware(
  withErrorHandling,
  withCsrf,
  withAuth,
  (handler) => withAPIRateLimit(handler, "quiz")
)(handlePost);
