import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import CourseNote from "@/models/CourseNote";

async function handleGet(request, { params }) {
  await connectToDatabase();
  const { id } = await params;
  const notes = await CourseNote.find({ classroomId: id })
    .populate("authorId", "name email")
    .sort({ isPinned: -1, weekNumber: 1, createdAt: -1 })
    .lean();
  return NextResponse.json({ success: true, notes });
}

async function handlePost(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;
  const { title, content, tags, isAiGenerated, aiPrompt, weekNumber } = await request.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const note = await CourseNote.create({
    classroomId: id,
    authorId: user._id,
    title: title.trim(),
    content: content?.trim() || "",
    tags: tags || [],
    isAiGenerated: isAiGenerated || false,
    aiPrompt: aiPrompt || "",
    weekNumber: weekNumber || 0,
  });

  const populated = await note.populate("authorId", "name email");
  return NextResponse.json({ success: true, note: populated });
}

export const GET = combineMiddleware(withErrorHandling)(handleGet);
export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
