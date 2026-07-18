import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const handler = combineMiddleware(withErrorHandling, withCsrf, withAuth);

async function handleGet(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all";
  const q = searchParams.get("q") || "";
  const db = (await connectToDatabase()).db;

  const results = { courses: [], quizzes: [], flashcards: [] };

  if (type === "all" || type === "course") {
    const courseQuery = { createdBy: user._id };
    if (q) courseQuery.title = { $regex: q, $options: "i" };
    const courses = await db.collection("courses").find(courseQuery).project({ title: 1, level: 1, totalModules: 1, totalLessons: 1, description: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(50).toArray();
    results.courses = courses.map((c) => ({ id: c._id.toString(), title: c.title, level: c.level, totalModules: c.totalModules, totalLessons: c.totalLessons, description: c.description || "" }));
  }

  if (type === "all" || type === "quiz") {
    const Quiz = (await import("@/models/Quiz")).default;
    const quizQuery = { createdBy: user._id };
    if (q) quizQuery.title = { $regex: q, $options: "i" };
    const quizzes = await Quiz.find(quizQuery).select("title course questions createdAt").sort({ createdAt: -1 }).limit(50).lean();
    results.quizzes = quizzes.map((qz) => ({ id: qz._id.toString(), title: qz.title, course: qz.course, questionCount: qz.questions?.length || 0 }));
  }

  if (type === "all" || type === "flashcard") {
    const fcQuery = { userId: new ObjectId(user._id) };
    if (q) fcQuery.title = { $regex: q, $options: "i" };
    const flashcards = await db.collection("cardSets").find(fcQuery).project({ title: 1, topic: 1, difficulty: 1, totalCards: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(50).toArray();
    results.flashcards = flashcards.map((fc) => ({ id: fc._id.toString(), title: fc.title, topic: fc.topic, difficulty: fc.difficulty, totalCards: fc.totalCards }));
  }

  return NextResponse.json({ success: true, ...results });
}

export const GET = handler(handleGet);
