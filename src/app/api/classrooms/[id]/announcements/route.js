import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";

async function handlePost(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;
  const { title, content } = await request.json();

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const classroom = await Classroom.findById(id);
  if (!classroom || classroom.instructorId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  classroom.announcements.push({ title: title.trim(), content: content.trim() });
  await classroom.save();

  return NextResponse.json({ success: true, announcement: classroom.announcements[classroom.announcements.length - 1] });
}

export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
