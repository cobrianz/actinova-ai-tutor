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
  const myContent = searchParams.get("myContent") === "1";

  const results = { courses: [], quizzes: [], flashcards: [], reports: [] };

  let userId;
  try { userId = new ObjectId(user._id); } catch { userId = user._id; }
  const userIdStr = String(user._id);

  if (type === "all" || type === "course") {
    const courseMatch = myContent
      ? { $or: [{ userId: userId }, { userId: userIdStr }] }
      : { $or: [{ userId: userId }, { userId: userIdStr }] };
    const qFilter = q ? { $and: [courseMatch, { $or: [{ title: { $regex: q, $options: "i" } }, { topic: { $regex: q, $options: "i" } }] }] } : courseMatch;
    const courses = await db.collection("library").find({ ...qFilter, $or: [{ format: "course" }, { type: "course" }] }).project({ title: 1, level: 1, totalModules: 1, totalLessons: 1, description: 1, topic: 1, difficulty: 1, userId: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(100).toArray();
    results.courses = courses.map((c) => ({ id: c._id.toString(), title: c.title || c.topic || "Untitled Course", level: c.level || c.difficulty || "", totalModules: c.totalModules || 0, totalLessons: c.totalLessons || 0, description: c.description || "", isOwn: String(c.userId) === userIdStr }));
  }

  if (type === "all" || type === "quiz") {
    const Quiz = (await import("@/models/Quiz")).default;
    const quizQuery = { $or: [{ createdBy: userId }, { createdBy: userIdStr }] };
    if (q) quizQuery.title = { $regex: q, $options: "i" };
    const quizzes = await Quiz.find(quizQuery).select("title course questions createdAt createdBy").sort({ createdAt: -1 }).limit(100).lean();
    results.quizzes = quizzes.map((qz) => ({ id: qz._id.toString(), title: qz.title, course: qz.course, questionCount: qz.questions?.length || 0, isOwn: true }));
  }

  if (type === "all" || type === "flashcard") {
    const fcQuery = { $or: [{ userId: userId }, { userId: userIdStr }] };
    if (q) fcQuery.title = { $regex: q, $options: "i" };
    const flashcards = await db.collection("cardSets").find(fcQuery).project({ title: 1, topic: 1, difficulty: 1, totalCards: 1, userId: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(100).toArray();
    results.flashcards = flashcards.map((fc) => ({ id: fc._id.toString(), title: fc.title, topic: fc.topic, difficulty: fc.difficulty, totalCards: fc.totalCards, isOwn: String(fc.userId) === userIdStr }));
  }

  if (type === "all" || type === "report") {
    const reportQuery = { $or: [{ userId: userId }, { userId: userIdStr }] };
    if (q) reportQuery.$and = [{ $or: [{ title: { $regex: q, $options: "i" } }, { topic: { $regex: q, $options: "i" } }] }];
    const reports = await db.collection("reports").find(reportQuery).project({ title: 1, topic: 1, format: 1, summary: 1, userId: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(100).toArray();
    results.reports = reports.map((r) => ({ id: r._id.toString(), title: r.title || r.topic || "Untitled Report", topic: r.topic || "", summary: r.summary || "", format: r.format || "", isOwn: true }));
  }

  return NextResponse.json({ success: true, ...results });
}

export const GET = handler(handleGet);
