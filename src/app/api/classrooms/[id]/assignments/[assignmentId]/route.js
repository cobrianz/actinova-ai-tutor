import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import Assignment from "@/models/Assignment";
import StudentProgress from "@/models/StudentProgress";
import Enrollment from "@/models/Enrollment";
import mongoose from "mongoose";

async function handleGet(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id, assignmentId } = await params;

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }

  const isInstructor = classroom.instructorId.toString() === user._id.toString();
  const isEnrolled = await Enrollment.findOne({
    classroomId: id,
    studentId: user._id,
    status: "active",
  }).lean();

  if (!isInstructor && !isEnrolled) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const assignment = await Assignment.findById(assignmentId).lean();
  if (!assignment || assignment.classroomId.toString() !== id) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  const progressFilter = { assignmentId, classroomId: id };
  if (!isInstructor) {
    progressFilter.studentId = user._id;
  }

  const progress = await StudentProgress.find(progressFilter)
    .populate("studentId", "name email")
    .lean();

  const result = {
    ...assignment,
    _id: undefined,
    id: assignment._id.toString(),
    courseId: assignment.courseId?.toString() || null,
    createdBy: assignment.createdBy.toString(),
    classroomId: assignment.classroomId.toString(),
  };

  if (isInstructor) {
    result.studentProgress = progress.map((p) => ({
      id: p._id.toString(),
      studentId: p.studentId._id?.toString() || p.studentId.toString(),
      studentName: p.studentId.name || null,
      studentEmail: p.studentId.email || null,
      status: p.status,
      progress: p.progress,
      score: p.score,
      completedAt: p.completedAt,
      timeSpentMinutes: p.timeSpentMinutes,
      lastAccessedAt: p.lastAccessedAt,
      submissionText: p.submissionText || "",
      submissionFiles: p.submissionFiles || [],
      submittedAt: p.submittedAt,
      feedback: p.feedback || "",
    }));
  } else {
    result.myProgress = progress.length > 0
      ? {
          id: progress[0]._id.toString(),
          status: progress[0].status,
          progress: progress[0].progress,
          score: progress[0].score,
          completedAt: progress[0].completedAt,
          timeSpentMinutes: progress[0].timeSpentMinutes,
          lastAccessedAt: progress[0].lastAccessedAt,
          submissionText: progress[0].submissionText || "",
          submissionFiles: progress[0].submissionFiles || [],
          submittedAt: progress[0].submittedAt,
          feedback: progress[0].feedback || "",
        }
      : null;
  }

  return NextResponse.json({ success: true, assignment: result });
}

async function handlePut(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id, assignmentId } = await params;

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }

  if (classroom.instructorId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment || assignment.classroomId.toString() !== id) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    title,
    description,
    instructions,
    courseId,
    type,
    category,
    dueDate,
    availableFrom,
    availableUntil,
    maxScore,
    passingScore,
    weight,
    rubric,
    attachments,
    allowLateSubmissions,
    maxAttempts,
    isGroupAssignment,
    weekNumber,
    quizQuestions,
  } = body;

  if (title !== undefined) assignment.title = title.trim();
  if (description !== undefined) assignment.description = description?.trim() || "";
  if (instructions !== undefined) assignment.instructions = instructions?.trim() || "";
  if (courseId !== undefined) {
    const isValidId = mongoose.Types.ObjectId.isValid(courseId);
    assignment.courseId = isValidId ? courseId : null;
  }
  if (type !== undefined) assignment.type = type;
  if (category !== undefined) assignment.category = category?.trim() || "";
  if (dueDate !== undefined) assignment.dueDate = dueDate ? new Date(dueDate) : null;
  if (availableFrom !== undefined) assignment.availableFrom = availableFrom ? new Date(availableFrom) : null;
  if (availableUntil !== undefined) assignment.availableUntil = availableUntil ? new Date(availableUntil) : null;
  if (maxScore !== undefined) assignment.maxScore = maxScore;
  if (passingScore !== undefined) assignment.passingScore = passingScore;
  if (weight !== undefined) assignment.weight = weight;
  if (rubric !== undefined) assignment.rubric = rubric;
  if (attachments !== undefined) assignment.attachments = attachments;
  if (allowLateSubmissions !== undefined) assignment.allowLateSubmissions = allowLateSubmissions;
  if (maxAttempts !== undefined) assignment.maxAttempts = maxAttempts;
  if (isGroupAssignment !== undefined) assignment.isGroupAssignment = isGroupAssignment;
  if (weekNumber !== undefined) assignment.weekNumber = weekNumber;
  if (quizQuestions !== undefined) assignment.quizQuestions = quizQuestions;

  await assignment.save();

  return NextResponse.json({
    success: true,
    assignment: {
      id: assignment._id.toString(),
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions || "",
      courseId: assignment.courseId?.toString() || null,
      type: assignment.type,
      category: assignment.category || "",
      dueDate: assignment.dueDate,
      availableFrom: assignment.availableFrom,
      availableUntil: assignment.availableUntil,
      maxScore: assignment.maxScore,
      passingScore: assignment.passingScore,
      weight: assignment.weight,
      rubric: assignment.rubric || [],
      attachments: assignment.attachments || [],
      allowLateSubmissions: assignment.allowLateSubmissions,
      maxAttempts: assignment.maxAttempts,
      isGroupAssignment: assignment.isGroupAssignment,
      weekNumber: assignment.weekNumber,
      quizQuestions: assignment.quizQuestions || [],
      isActive: assignment.isActive,
      createdAt: assignment.createdAt,
    },
  });
}

async function handleDelete(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id, assignmentId } = await params;

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }

  if (classroom.instructorId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment || assignment.classroomId.toString() !== id) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  assignment.isActive = false;
  await assignment.save();

  return NextResponse.json({
    success: true,
    message: "Assignment deleted",
  });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const PUT = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePut);
export const DELETE = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handleDelete);
export const dynamic = "force-dynamic";
