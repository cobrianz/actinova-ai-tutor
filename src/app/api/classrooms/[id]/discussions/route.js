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

async function handlePatch(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;
  const { discussionId, weekNumber } = await request.json();

  const classroom = await (await import("@/models/Classroom")).default.findById(id).lean();
  if (!classroom || classroom.instructorId?.toString() !== user._id?.toString()) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const discussion = await Discussion.findByIdAndUpdate(
    discussionId,
    { weekNumber: weekNumber || 0 },
    { new: true }
  ).lean();
  if (!discussion) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, discussion });
}

export const PATCH = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePatch);

async function handleDelete(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;
  const { discussionId } = await request.json();

  const classroom = await (await import("@/models/Classroom")).default.findById(id).lean();
  if (!classroom || classroom.instructorId?.toString() !== user._id?.toString()) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const DiscussionPost = (await import("@/models/DiscussionPost")).default;
  await DiscussionPost.deleteMany({ discussionId });
  const deleted = await Discussion.findByIdAndDelete(discussionId);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}

export const DELETE = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handleDelete);
