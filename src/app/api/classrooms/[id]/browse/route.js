import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const handler = combineMiddleware(withErrorHandling, withCsrf, withAuth);

async function handleGet(request, { params }) {
  const { db } = await connectToDatabase();
  const user = request.user;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all";
  const q = searchParams.get("q") || "";

  const results = { courses: [], quizzes: [], flashcards: [] };

  if (type === "all" || type === "course") {
    let userId;
    try { userId = new ObjectId(user._id); } catch { userId = user._id; }
    const courseQuery = { $or: [{ userId: userId }, { userId: String(user._id) }] };
    if (q) courseQuery.$and = [{ $or: [{ title: { $regex: q, $options: "i" } }, { topic: { $regex: q, $options: "i" } }] }];
    const courses = await db.collection("library").find({ ...courseQuery, $or: [{ format: "course" }, { type: "course" }] }).project({ title: 1, level: 1, totalModules: 1, totalLessons: 1, description: 1, topic: 1, difficulty: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(100).toArray();
    results.courses = courses.map((c) => ({ id: c._id.toString(), title: c.title || c.topic || "Untitled Course", level: c.level || c.difficulty || "", totalModules: c.totalModules || 0, totalLessons: c.totalLessons || 0, description: c.description || "" }));
  }

  if (type === "all" || type === "quiz") {
    const Quiz = (await import("@/models/Quiz")).default;
    let userId;
    try { userId = new ObjectId(user._id); } catch { userId = user._id; }
    const quizQuery = { $or: [{ createdBy: userId }, { createdBy: String(user._id) }] };
    if (q) quizQuery.title = { $regex: q, $options: "i" };
    const quizzes = await Quiz.find(quizQuery).select("title course questions createdAt").sort({ createdAt: -1 }).limit(100).lean();
    results.quizzes = quizzes.map((qz) => ({ id: qz._id.toString(), title: qz.title, course: qz.course, questionCount: qz.questions?.length || 0 }));
  }

  if (type === "all" || type === "flashcard") {
    let userId;
    try { userId = new ObjectId(user._id); } catch { userId = user._id; }
    const fcQuery = { $or: [{ userId: userId }, { userId: String(user._id) }] };
    if (q) fcQuery.title = { $regex: q, $options: "i" };
    const flashcards = await db.collection("cardSets").find(fcQuery).project({ title: 1, topic: 1, difficulty: 1, totalCards: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(100).toArray();
    results.flashcards = flashcards.map((fc) => ({ id: fc._id.toString(), title: fc.title, topic: fc.topic, difficulty: fc.difficulty, totalCards: fc.totalCards }));
  }

  return NextResponse.json({ success: true, ...results });
}

export const GET = handler(handleGet);
