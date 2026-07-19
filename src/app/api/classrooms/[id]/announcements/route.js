import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";

async function handlePost(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;
  const { title, content, weekNumber } = await request.json();

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const classroom = await Classroom.findById(id);
  if (!classroom || !classroom.instructorId || !user._id || classroom.instructorId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  classroom.announcements.push({ title: title.trim(), content: content.trim(), weekNumber: weekNumber || 0 });
  await classroom.save();

  return NextResponse.json({ success: true, announcement: classroom.announcements[classroom.announcements.length - 1] });
}

export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);

/**
 * DELETE /api/classrooms/[id]/announcements?announcementId=xxx
 */
async function handleDelete(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const announcementId = searchParams.get("announcementId");

  if (!announcementId) {
    return NextResponse.json({ error: "announcementId required" }, { status: 400 });
  }

  const classroom = await Classroom.findById(id);
  if (!classroom || classroom.instructorId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  classroom.announcements = classroom.announcements.filter(
    (a) => a._id.toString() !== announcementId
  );
  await classroom.save();

  return NextResponse.json({ success: true });
}

export const DELETE = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handleDelete);
