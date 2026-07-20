import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import Enrollment from "@/models/Enrollment";
import { ObjectId } from "mongodb";

const handler = combineMiddleware(withErrorHandling, withCsrf, withAuth);

async function handleGet(request, { params }) {
  const { db } = await connectToDatabase();
  const user = request.user;
  const { id } = await params;
  const { searchParams } = new URL(request.url);

  const contentId = searchParams.get("contentId");
  const moduleIdx = parseInt(searchParams.get("moduleIdx"), 10);
  const lessonIdx = parseInt(searchParams.get("lessonIdx"), 10);

  if (!contentId || isNaN(moduleIdx) || isNaN(lessonIdx)) {
    return NextResponse.json({ error: "contentId, moduleIdx, and lessonIdx are required" }, { status: 400 });
  }

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isInstructor = classroom.instructorId?.toString() === user._id?.toString();
  if (!isInstructor) {
    const enrollment = await Enrollment.findOne({ classroomId: id, studentId: user._id, status: "active" }).lean();
    if (!enrollment) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  const forkEntry = classroom.forkedContent?.find(
    (fc) => fc.contentId?.toString() === contentId && fc.contentType === "course"
  );
  if (!forkEntry) return NextResponse.json({ error: "Forked content not found" }, { status: 404 });

  if (!isInstructor && !forkEntry.unlocked) {
    return NextResponse.json({ content: "", hasContent: false, locked: true });
  }

  if (!isInstructor && forkEntry.weekNumber && !(classroom.openedWeeks || []).includes(forkEntry.weekNumber)) {
    return NextResponse.json({ content: "", hasContent: false, locked: true });
  }

  let content = "";
  let hasContent = false;

  const forkedModules = forkEntry.meta?.modules;
  if (forkedModules?.[moduleIdx]?.lessons?.[lessonIdx]?.content) {
    const c = forkedModules[moduleIdx].lessons[lessonIdx].content;
    if (c && !c.includes("coming soon")) {
      content = c;
      hasContent = true;
    }
  }

  if (!hasContent && ObjectId.isValid(contentId)) {
    try {
      const sourceDoc = await db.collection("library").findOne(
        { _id: new ObjectId(contentId) },
        { projection: { [`modules.${moduleIdx}.lessons.${lessonIdx}.content`]: 1, [`courseData.modules.${moduleIdx}.lessons.${lessonIdx}.content`]: 1 } }
      );
      const sourceContent = sourceDoc?.modules?.[moduleIdx]?.lessons?.[lessonIdx]?.content
        || sourceDoc?.courseData?.modules?.[moduleIdx]?.lessons?.[lessonIdx]?.content;
      if (sourceContent && !sourceContent.includes("coming soon")) {
        content = sourceContent;
        hasContent = true;

        if (forkedModules?.[moduleIdx]?.lessons?.[lessonIdx]) {
          forkEntry.meta.modules[moduleIdx].lessons[lessonIdx].content = sourceContent;
          await Classroom.findByIdAndUpdate(id, {
            $set: { [`forkedContent.${classroom.forkedContent.indexOf(forkEntry)}.meta.modules.${moduleIdx}.lessons.${lessonIdx}.content`]: sourceContent }
          });
        }
      }
    } catch (_) {}
  }

  return NextResponse.json({ content, hasContent });
}

export const GET = handler(handleGet);
