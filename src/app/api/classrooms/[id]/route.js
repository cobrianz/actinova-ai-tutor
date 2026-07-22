import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import Enrollment from "@/models/Enrollment";
import Assignment from "@/models/Assignment";
import StudentProgress from "@/models/StudentProgress";
import CourseMaterial from "@/models/CourseMaterial";
import Discussion from "@/models/Discussion";
import DiscussionPost from "@/models/DiscussionPost";
import ClassroomMessage from "@/models/ClassroomMessage";
import mongoose from "mongoose";

async function handleDelete(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }

  if (classroom.instructorId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Classroom.updateOne({ _id: id }, { isActive: false }, { session });
      await Enrollment.updateMany({ classroomId: id }, { status: "removed" }, { session });
      await Assignment.updateMany({ classroomId: id }, { isActive: false }, { session });

      // Cascade delete associated entities
      await CourseMaterial.deleteMany({ classroomId: id }, { session });
      
      const discussions = await Discussion.find({ classroomId: id }).session(session);
      const discussionIds = discussions.map((d) => d._id);
      await DiscussionPost.deleteMany({ discussionId: { $in: discussionIds } }, { session });
      await Discussion.deleteMany({ classroomId: id }, { session });

      await ClassroomMessage.deleteMany({ classroomId: id }, { session });
    });
  } finally {
    await session.endSession();
  }

  return NextResponse.json({ success: true });
}

async function handlePatch(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;
  const body = await request.json();

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }

  if (classroom.instructorId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { name, description, subject, maxStudents, semester, academicLevel, gradingScheme, prerequisites, syllabus, schedule, startDate, durationWeeks, settings, openedWeeks, modules } = body;

  if (startDate && new Date(startDate) < new Date(new Date().toDateString())) {
    return NextResponse.json(
      { error: "Start date cannot be in the past", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const update = {};
  if (name !== undefined) update.name = name.trim();
  if (description !== undefined) update.description = description.trim();
  if (subject !== undefined) update.subject = subject.trim();
  if (maxStudents !== undefined) update.maxStudents = maxStudents;
  if (semester !== undefined) update.semester = semester;
  if (academicLevel !== undefined) update.academicLevel = academicLevel;
  if (gradingScheme !== undefined) update.gradingScheme = gradingScheme;
  if (prerequisites !== undefined) update.prerequisites = prerequisites;
  if (syllabus !== undefined) update.syllabus = syllabus;
  if (schedule !== undefined) update.schedule = schedule;
  if (startDate !== undefined) update.startDate = startDate;
  if (durationWeeks !== undefined) update.durationWeeks = durationWeeks;
  if (settings !== undefined) update.settings = { ...classroom.settings, ...settings };
  if (openedWeeks !== undefined) update.openedWeeks = openedWeeks;
  if (modules !== undefined) update.modules = modules;

  await Classroom.updateOne({ _id: id }, { $set: update });

  return NextResponse.json({ success: true });
}

export const DELETE = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handleDelete);
export const PATCH = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePatch);
export const dynamic = "force-dynamic";
