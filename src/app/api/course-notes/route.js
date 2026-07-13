import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { ObjectId } from "mongodb";

async function handleGet(request) {
  const userId = request.user._id.toString();
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }

  const { db } = await connectToDatabase();
  const notes = await db
    .collection("course_notes")
    .find({ userId, courseId })
    .sort({ updatedAt: -1 })
    .toArray();

  return NextResponse.json({
    success: true,
    notes: notes.map((n) => ({
      _id: n._id.toString(),
      courseId: n.courseId,
      lessonId: n.lessonId,
      note: n.note,
      bookmarked: n.bookmarked || false,
      updatedAt: n.updatedAt,
    })),
  });
}

async function handlePost(request) {
  const userId = request.user._id.toString();
  const body = await request.json();
  const { courseId, lessonId, note, bookmarked } = body;

  if (!courseId || !lessonId) {
    return NextResponse.json(
      { error: "courseId and lessonId are required" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();
  const now = new Date();

  await db.collection("course_notes").updateOne(
    { userId, courseId, lessonId },
    {
      $set: {
        note: note || "",
        bookmarked: Boolean(bookmarked),
        updatedAt: now,
      },
      $setOnInsert: {
        userId,
        courseId,
        lessonId,
        createdAt: now,
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}

async function handleDelete(request) {
  const userId = request.user._id.toString();
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId");

  if (!courseId || !lessonId) {
    return NextResponse.json(
      { error: "courseId and lessonId are required" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();
  await db.collection("course_notes").deleteOne({ userId, courseId, lessonId });

  return NextResponse.json({ success: true });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const POST = combineMiddleware(withErrorHandling, withAuth)(handlePost);
export const DELETE = combineMiddleware(withErrorHandling, withAuth)(handleDelete);
