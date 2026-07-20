import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import Classroom from "@/models/Classroom";

const handler = combineMiddleware(withErrorHandling, withCsrf, withAuth);

async function handleGet(request, { params }) {
  const { id } = await params;
  const user = request.user;

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const completions = (classroom.lessonCompletions || []).filter(
    (lc) => lc.studentId?.toString() === user._id?.toString()
  );

  return NextResponse.json({ success: true, completed: completions.map((c) => c.lessonKey) });
}

async function handlePost(request, { params }) {
  const { id } = await params;
  const user = request.user;
  const body = await request.json();
  const { lessonKey, completed } = body;

  if (!lessonKey) {
    return NextResponse.json({ error: "lessonKey is required" }, { status: 400 });
  }

  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const idx = (classroom.lessonCompletions || []).findIndex(
    (lc) => lc.studentId?.toString() === user._id?.toString() && lc.lessonKey === lessonKey
  );

  if (completed) {
    if (idx === -1) {
      classroom.lessonCompletions.push({ studentId: user._id, lessonKey, completedAt: new Date() });
    }
  } else {
    if (idx !== -1) {
      classroom.lessonCompletions.splice(idx, 1);
    }
  }

  await classroom.save();

  return NextResponse.json({ success: true });
}

export const GET = handler(handleGet);
export const POST = handler(handlePost);
export const dynamic = "force-dynamic";
