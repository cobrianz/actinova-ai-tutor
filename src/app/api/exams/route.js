export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";

// GET /api/exams — list user's exams
async function handleGet(request) {
  const user = request.user;
  const { db } = await connectToDatabase();

  const exams = await db
    .collection("exams")
    .find({ userId: new ObjectId(user._id) })
    .sort({ createdAt: -1 })
    .project({ questions: 0 }) // exclude question details in list view
    .toArray();

  return NextResponse.json({
    success: true,
    exams: exams.map((e) => ({ ...e, _id: e._id.toString(), userId: e.userId?.toString() })),
  });
}

// POST /api/exams — submit an exam attempt
async function handlePost(request) {
  const user = request.user;
  const body = await request.json();
  const { examId, answers, timeTaken } = body;

  if (!examId || !Array.isArray(answers)) {
    return NextResponse.json({ error: "examId and answers are required", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { db } = await connectToDatabase();

  const exam = await db.collection("exams").findOne({
    _id: new ObjectId(examId),
    userId: new ObjectId(user._id),
  });

  if (!exam) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  // Grade the exam
  let score = 0;
  const gradedAnswers = exam.questions.map((question, idx) => {
    const userAnswer = answers[idx]?.answer ?? null;
    let isCorrect = false;

    if (question.type === "multiple_choice" || question.type === "true_false") {
      isCorrect = userAnswer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
    } else if (question.type === "fill_blank") {
      isCorrect = userAnswer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
    } else if (question.type === "short_answer") {
      // Short answer gets partial credit — mark for review but give point if non-empty
      isCorrect = (userAnswer?.trim().length ?? 0) > 5;
    }

    if (isCorrect) score += question.points || 1;

    return {
      questionId: question.id,
      userAnswer,
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      points: isCorrect ? question.points || 1 : 0,
    };
  });

  const percentage = Math.round((score / exam.totalPoints) * 100);
  const passed = score >= exam.passingScore;

  const attempt = {
    attemptId: new ObjectId(),
    userId: new ObjectId(user._id),
    score,
    percentage,
    passed,
    timeTaken: parseInt(timeTaken) || 0,
    gradedAnswers,
    submittedAt: new Date(),
  };

  await db.collection("exams").updateOne(
    { _id: new ObjectId(examId) },
    {
      $push: { attempts: attempt },
      $set: { updatedAt: new Date() },
    }
  );

  return NextResponse.json({
    success: true,
    result: {
      examId,
      score,
      totalPoints: exam.totalPoints,
      percentage,
      passed,
      passingScore: exam.passingScore,
      timeTaken: attempt.timeTaken,
      gradedAnswers,
    },
  });
}

// DELETE /api/exams?examId=... — delete an exam
async function handleDelete(request) {
  const user = request.user;
  const url = new URL(request.url);
  const examId = url.searchParams.get("examId");

  if (!examId) {
    return NextResponse.json({ error: "examId is required" }, { status: 400 });
  }

  const { db } = await connectToDatabase();
  const result = await db.collection("exams").deleteOne({
    _id: new ObjectId(examId),
    userId: new ObjectId(user._id),
  });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
export const DELETE = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handleDelete);
