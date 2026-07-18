import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Discussion from "@/models/Discussion";

async function handleGet(request, { params }) {
  await connectToDatabase();
  const { id } = await params;
  const discussions = await Discussion.find({ classroomId: id })
    .populate("createdBy", "name email")
    .sort({ isPinned: -1, weekNumber: 1, createdAt: -1 })
    .lean();
  return NextResponse.json({ success: true, discussions });
}

async function handlePost(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;
  const { title, description, weekNumber } = await request.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const discussion = await Discussion.create({
    classroomId: id,
    createdBy: user._id,
    title: title.trim(),
    description: description?.trim() || "",
    weekNumber: weekNumber || 0,
  });

  return NextResponse.json({ success: true, discussion });
}

export const GET = combineMiddleware(withErrorHandling)(handleGet);
export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
