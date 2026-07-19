import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import { ObjectId } from "mongodb";

const handler = combineMiddleware(withErrorHandling, withCsrf, withAuth);

async function handleGet(request, { params }) {
  await connectToDatabase();
  const { id } = await params;
  const classroom = await Classroom.findById(id).lean();
  if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, forkedContent: classroom.forkedContent || [] });
}

async function handlePost(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;

  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!classroom.instructorId || !user._id || classroom.instructorId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await request.json();
  const { contentType, contentId, weekNumber, availableFrom, availableUntil } = body;

  if (!contentType || !contentId) {
    return NextResponse.json({ error: "contentType and contentId are required" }, { status: 400 });
  }

  let sourceDoc = null;
  let title = "";
  let description = "";
  let meta = {};

  const { db } = await connectToDatabase();

  if (contentType === "course") {
    sourceDoc = await db.collection("library").findOne({ _id: new ObjectId(contentId) });
    if (!sourceDoc) return NextResponse.json({ error: "Course not found" }, { status: 404 });
    title = sourceDoc.title || sourceDoc.topic || "Untitled Course";
    description = sourceDoc.description || "";
    meta = { level: sourceDoc.level || sourceDoc.difficulty, totalModules: sourceDoc.totalModules, totalLessons: sourceDoc.totalLessons, modules: sourceDoc.modules || sourceDoc.courseData?.modules };
  } else if (contentType === "quiz") {
    const Quiz = (await import("@/models/Quiz")).default;
    sourceDoc = await Quiz.findById(contentId).lean();
    if (!sourceDoc) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    title = sourceDoc.title || "Untitled Quiz";
    description = `Quiz with ${sourceDoc.questions?.length || 0} questions`;
    meta = { course: sourceDoc.course, questionCount: sourceDoc.questions?.length || 0 };
  } else if (contentType === "flashcard") {
    sourceDoc = await db.collection("cardSets").findOne({ _id: new ObjectId(contentId) });
    if (!sourceDoc) return NextResponse.json({ error: "Flashcard set not found" }, { status: 404 });
    title = sourceDoc.title || "Untitled Flashcards";
    description = `${sourceDoc.totalCards || 0} cards`;
    meta = { difficulty: sourceDoc.difficulty, totalCards: sourceDoc.totalCards };
  } else if (contentType === "report") {
    sourceDoc = await db.collection("reports").findOne({ _id: new ObjectId(contentId) });
    if (!sourceDoc) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    title = sourceDoc.title || sourceDoc.topic || "Untitled Report";
    description = sourceDoc.summary || "";
    meta = { topic: sourceDoc.topic, format: sourceDoc.format };
  } else {
    return NextResponse.json({ error: "Invalid contentType" }, { status: 400 });
  }

  const existing = classroom.forkedContent.find(
    (fc) => fc.contentType === contentType && fc.contentId.toString() === contentId
  );
  if (existing) return NextResponse.json({ error: "Already forked" }, { status: 409 });

  const forkEntry = {
    contentType,
    contentId: new ObjectId(contentId),
    title,
    description,
    weekNumber: weekNumber || 0,
    unlocked: true,
    availableFrom: availableFrom ? new Date(availableFrom) : null,
    availableUntil: availableUntil ? new Date(availableUntil) : null,
    forkedAt: new Date(),
    meta,
  };

  classroom.forkedContent.push(forkEntry);
  await classroom.save();

  const saved = classroom.forkedContent[classroom.forkedContent.length - 1];
  return NextResponse.json({ success: true, forked: { ...saved, contentId: saved.contentId.toString() } });
}

async function handleDelete(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;

  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!classroom.instructorId || !user._id || classroom.instructorId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { contentId, contentType } = await request.json();
  classroom.forkedContent = classroom.forkedContent.filter(
    (fc) => !(fc.contentId.toString() === contentId && fc.contentType === contentType)
  );
  await classroom.save();
  return NextResponse.json({ success: true });
}

async function handlePatch(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;

  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!classroom.instructorId || !user._id || classroom.instructorId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { contentId, contentType, unlocked, weekNumber, availableFrom, availableUntil } = await request.json();

  const entry = classroom.forkedContent.find(
    (fc) => fc.contentId.toString() === contentId && fc.contentType === contentType
  );
  if (!entry) return NextResponse.json({ error: "Forked content not found" }, { status: 404 });

  if (unlocked !== undefined) entry.unlocked = unlocked;
  if (weekNumber !== undefined) entry.weekNumber = weekNumber;
  if (availableFrom !== undefined) entry.availableFrom = availableFrom ? new Date(availableFrom) : null;
  if (availableUntil !== undefined) entry.availableUntil = availableUntil ? new Date(availableUntil) : null;

  await classroom.save();
  return NextResponse.json({ success: true, forked: entry });
}

export const GET = handler(handleGet);
export const POST = handler(handlePost);
export const DELETE = handler(handleDelete);
export const PATCH = handler(handlePatch);
