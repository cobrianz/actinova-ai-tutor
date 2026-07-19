import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import Enrollment from "@/models/Enrollment";
import ClassroomMessage from "@/models/ClassroomMessage";

/**
 * GET /api/classrooms/[id]/messages
 * Students: returns their own thread with the instructor.
 * Instructors: returns all student threads (grouped by student).
 */
async function handleGet(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId"); // instructor filtering a specific thread

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isInstructor = classroom.instructorId.toString() === user._id.toString();

  if (!isInstructor) {
    // Student: only their own thread
    const messages = await ClassroomMessage.find({
      classroomId: id,
      $or: [
        { senderId: user._id, recipientId: classroom.instructorId },
        { senderId: classroom.instructorId, recipientId: user._id },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();
    return NextResponse.json({ success: true, messages });
  }

  // Instructor with specific student thread
  if (studentId) {
    const messages = await ClassroomMessage.find({
      classroomId: id,
      $or: [
        { senderId: studentId, recipientId: user._id },
        { senderId: user._id, recipientId: studentId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();
    return NextResponse.json({ success: true, messages });
  }

  // Instructor: return summary of all threads (last message per student)
  const enrollments = await Enrollment.find({ classroomId: id, status: "active" }).lean();
  const threads = await Promise.all(
    enrollments.map(async (e) => {
      const last = await ClassroomMessage.findOne({
        classroomId: id,
        $or: [
          { senderId: e.studentId, recipientId: user._id },
          { senderId: user._id, recipientId: e.studentId },
        ],
      })
        .sort({ createdAt: -1 })
        .lean();
      const unread = await ClassroomMessage.countDocuments({
        classroomId: id,
        senderId: e.studentId,
        recipientId: user._id,
        read: { $ne: true },
      });
      return { studentId: e.studentId.toString(), lastMessage: last, unreadCount: unread };
    })
  );

  return NextResponse.json({ success: true, threads: threads.filter((t) => t.lastMessage) });
}

/**
 * POST /api/classrooms/[id]/messages
 * Send a message. Students → instructor. Instructor → specific student (recipientId in body).
 */
async function handlePost(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;
  const { content, recipientId, subject } = await request.json();

  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isInstructor = classroom.instructorId.toString() === user._id.toString();

  let resolvedRecipientId;
  if (isInstructor) {
    if (!recipientId) return NextResponse.json({ error: "recipientId required" }, { status: 400 });
    resolvedRecipientId = recipientId;
  } else {
    // Students always message the instructor
    const enrollment = await Enrollment.findOne({ classroomId: id, studentId: user._id, status: "active" });
    if (!enrollment) return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    resolvedRecipientId = classroom.instructorId.toString();
  }

  const message = await ClassroomMessage.create({
    classroomId: id,
    senderId: user._id,
    senderName: user.name,
    senderRole: user.role,
    recipientId: resolvedRecipientId,
    subject: subject?.trim() || null,
    content: content.trim(),
    read: false,
  });

  return NextResponse.json({ success: true, message });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
export const dynamic = "force-dynamic";
