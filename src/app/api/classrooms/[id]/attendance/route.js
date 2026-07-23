import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";
import mongoose from "mongoose";

// GET /api/classrooms/[id]/attendance
// Returns attendance records for the classroom.
// Instructors get all students; students get their own records.
async function handleGet(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }

  const isInstructor = classroom.instructorId.toString() === user._id.toString();

  const isEnrolled = isInstructor
    ? true
    : !!(await Enrollment.findOne({ classroomId: id, studentId: user._id, status: "active" }).lean());

  if (!isEnrolled) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const attendance = classroom.attendance || [];

  if (isInstructor) {
    // Return all attendance records with student info
    const enrollments = await Enrollment.find({ classroomId: id, status: "active" }).lean();
    const studentIds = enrollments.map((e) => e.studentId);
    const students = await User.find({ _id: { $in: studentIds } }).select("name email").lean();

    return NextResponse.json({
      success: true,
      attendance,
      students: students.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        email: s.email,
      })),
      isInstructor: true,
    });
  }

  // Student: return only their own records
  const myRecords = attendance.filter(
    (r) => r.studentId && r.studentId.toString() === user._id.toString()
  );

  return NextResponse.json({
    success: true,
    attendance: myRecords,
    isInstructor: false,
  });
}

// POST /api/classrooms/[id]/attendance
// Body: { date: "YYYY-MM-DD", records: [{ studentId, status }] }
// Instructor marks bulk attendance for a session.
async function handlePost(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;

  const classroom = await Classroom.findById(id);
  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }

  if (classroom.instructorId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Only instructors can mark attendance" }, { status: 403 });
  }

  const { date, records } = await request.json();

  if (!date || !Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: "date and records are required" }, { status: 400 });
  }

  const sessionDate = new Date(date);
  if (isNaN(sessionDate.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const validStatuses = ["present", "absent", "late", "excused"];

  // Remove existing records for this date, then add new ones
  const existingAttendance = classroom.attendance || [];
  const dateStr = sessionDate.toISOString().split("T")[0];

  const filtered = existingAttendance.filter((r) => {
    const rDate = new Date(r.date).toISOString().split("T")[0];
    return rDate !== dateStr;
  });

  const newRecords = records
    .filter((r) => r.studentId && validStatuses.includes(r.status))
    .map((r) => ({
      studentId: new mongoose.Types.ObjectId(r.studentId),
      date: sessionDate,
      status: r.status,
      note: r.note?.trim() || "",
      markedBy: user._id,
      markedAt: new Date(),
    }));

  classroom.attendance = [...filtered, ...newRecords];
  await classroom.save();

  return NextResponse.json({ success: true, savedCount: newRecords.length });
}

// PATCH /api/classrooms/[id]/attendance
// Body: { studentId, date, status, note }
// Update a single student attendance record.
async function handlePatch(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;

  const classroom = await Classroom.findById(id);
  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }

  if (classroom.instructorId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Only instructors can update attendance" }, { status: 403 });
  }

  const { studentId, date, status, note } = await request.json();

  if (!studentId || !date || !status) {
    return NextResponse.json({ error: "studentId, date, and status are required" }, { status: 400 });
  }

  const validStatuses = ["present", "absent", "late", "excused"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const sessionDate = new Date(date);
  const dateStr = sessionDate.toISOString().split("T")[0];

  const attendance = classroom.attendance || [];
  const idx = attendance.findIndex((r) => {
    const rDate = new Date(r.date).toISOString().split("T")[0];
    return rDate === dateStr && r.studentId.toString() === studentId;
  });

  if (idx !== -1) {
    attendance[idx].status = status;
    attendance[idx].note = note?.trim() || "";
    attendance[idx].markedBy = user._id;
    attendance[idx].markedAt = new Date();
  } else {
    attendance.push({
      studentId: new mongoose.Types.ObjectId(studentId),
      date: sessionDate,
      status,
      note: note?.trim() || "",
      markedBy: user._id,
      markedAt: new Date(),
    });
  }

  classroom.attendance = attendance;
  await classroom.save();

  return NextResponse.json({ success: true });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
export const PATCH = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePatch);
export const dynamic = "force-dynamic";
