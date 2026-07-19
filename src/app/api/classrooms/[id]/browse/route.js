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
    const userFilter = { $or: [{ userId: userId }, { userId: userIdStr }] };
    const searchFilter = q ? { $or: [{ title: { $regex: q, $options: "i" } }, { topic: { $regex: q, $options: "i" } }] } : {};
    const courses = await db.collection("library").find({ ...userFilter, ...searchFilter, $or: [{ format: "course" }, { type: "course" }] }).project({ title: 1, level: 1, totalModules: 1, totalLessons: 1, description: 1, topic: 1, difficulty: 1, userId: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(100).toArray();
    results.courses = courses.map((c) => ({ id: c._id.toString(), title: c.title || c.topic || "Untitled Course", level: c.level || c.difficulty || "", totalModules: c.totalModules || 0, totalLessons: c.totalLessons || 0, description: c.description || "" }));
  }

  if (type === "all" || type === "quiz") {
    const userFilter = { $or: [{ createdBy: userId }, { createdBy: userIdStr }, { userId: userId }, { userId: userIdStr }] };
    const searchFilter = q ? { title: { $regex: q, $options: "i" } } : {};
    const query = { ...userFilter, ...searchFilter };

    const Quiz = (await import("@/models/Quiz")).default;
    const quizzesFromTests = await Quiz.find(query).select("title course questions createdAt createdBy").sort({ createdAt: -1 }).limit(100).lean();

    const examsFromExams = await db.collection("exams").find({ ...userFilter, ...searchFilter }).project({ title: 1, topic: 1, questions: 1, createdAt: 1, userId: 1 }).sort({ createdAt: -1 }).limit(100).toArray();

    const allQuizzes = [
      ...quizzesFromTests.map((qz) => ({ id: qz._id.toString(), title: qz.title, course: qz.course, questionCount: qz.questions?.length || 0 })),
      ...examsFromExams.map((e) => ({ id: e._id.toString(), title: e.title || e.topic || "Untitled Exam", course: e.topic || "", questionCount: e.questions?.length || 0 })),
    ];
    results.quizzes = allQuizzes;
  }

  if (type === "all" || type === "flashcard") {
    const userFilter = { $or: [{ userId: userId }, { userId: userIdStr }] };
    const searchFilter = q ? { $or: [{ title: { $regex: q, $options: "i" } }, { topic: { $regex: q, $options: "i" } }] } : {};
    const flashcards = await db.collection("cardSets").find({ ...userFilter, ...searchFilter }).project({ title: 1, topic: 1, difficulty: 1, totalCards: 1, userId: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(100).toArray();
    results.flashcards = flashcards.map((fc) => ({ id: fc._id.toString(), title: fc.title, topic: fc.topic, difficulty: fc.difficulty, totalCards: fc.totalCards }));
  }

  if (type === "all" || type === "report") {
    const userFilter = { $or: [{ userId: userId }, { userId: userIdStr }] };
    const searchFilter = q ? { $or: [{ title: { $regex: q, $options: "i" } }, { topic: { $regex: q, $options: "i" } }] } : {};
    const reports = await db.collection("reports").find({ ...userFilter, ...searchFilter }).project({ title: 1, topic: 1, format: 1, summary: 1, userId: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(100).toArray();
    results.reports = reports.map((r) => ({ id: r._id.toString(), title: r.title || r.topic || "Untitled Report", topic: r.topic || "", summary: r.summary || "", format: r.format || "" }));
  }

  return NextResponse.json({ success: true, ...results });
}

export const GET = handler(handleGet);
