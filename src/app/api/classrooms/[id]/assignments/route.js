import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import Assignment from "@/models/Assignment";
import Enrollment from "@/models/Enrollment";
import StudentProgress from "@/models/StudentProgress";
import mongoose from "mongoose";

async function handlePost(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }

  if (!classroom.instructorId || !user._id || classroom.instructorId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, instructions, courseId, type, category, dueDate, availableFrom, availableUntil, maxScore, passingScore, weight, rubric, attachments, allowLateSubmissions, maxAttempts, isGroupAssignment, weekNumber, meta } = body;

  if (!title?.trim()) {
    return NextResponse.json(
      { error: "Assignment title is required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const assignment = await Assignment.create({
    classroomId: id,
    createdBy: user._id,
    title: title.trim(),
    description: description?.trim() || "",
    instructions: instructions?.trim() || "",
    courseId: courseId && mongoose.Types.ObjectId.isValid(courseId) ? courseId : null,
    type: type || "course",
    category: category?.trim() || "",
    dueDate: dueDate ? new Date(dueDate) : null,
    availableFrom: availableFrom ? new Date(availableFrom) : null,
    availableUntil: availableUntil ? new Date(availableUntil) : null,
    maxScore: maxScore ?? 100,
    passingScore: passingScore ?? 60,
    weight: weight ?? 1,
    rubric: rubric || [],
    attachments: attachments || [],
    allowLateSubmissions: allowLateSubmissions ?? true,
    maxAttempts: maxAttempts ?? 0,
    isGroupAssignment: isGroupAssignment || false,
    weekNumber: weekNumber || 0,
    meta: meta || null,
  });

  // Create progress records for all enrolled students
  const enrollments = await Enrollment.find({
    classroomId: id,
    status: "active",
  }).lean();

  if (enrollments.length > 0) {
    const progressDocs = enrollments.map((e) => ({
      assignmentId: assignment._id,
      studentId: e.studentId,
      classroomId: id,
    }));
    await StudentProgress.insertMany(progressDocs);
  }

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
      allowLateSubmissions: assignment.allowLateSubmissions,
      maxAttempts: assignment.maxAttempts,
      isGroupAssignment: assignment.isGroupAssignment,
      weekNumber: assignment.weekNumber,
      isActive: assignment.isActive,
      createdAt: assignment.createdAt,
      myProgress: null,
    },
  });
}

async function handleGet(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;

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

  const assignments = await Assignment.find({
    classroomId: id,
    isActive: true,
  })
    .sort({ weekNumber: 1, createdAt: -1 })
    .lean();

  let progressMap = {};
  if (!isInstructor) {
    const myProgress = await StudentProgress.find({
      classroomId: id,
      studentId: user._id,
    }).lean();
    myProgress.forEach((p) => {
      progressMap[p.assignmentId.toString()] = {
        status: p.status,
        progress: p.progress,
        score: p.score,
        completedAt: p.completedAt,
        timeSpentMinutes: p.timeSpentMinutes,
        submissionText: p.submissionText || "",
        submissionFiles: p.submissionFiles || [],
        submittedAt: p.submittedAt,
        feedback: p.feedback || "",
      };
    });
  }

  const result = assignments.map((a) => ({
    ...a,
    _id: undefined,
    id: a._id.toString(),
    courseId: a.courseId?.toString() || null,
    createdBy: a.createdBy.toString(),
    myProgress: progressMap[a._id.toString()] || null,
  }));

  return NextResponse.json({ success: true, assignments: result });
}

export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);

async function handlePatch(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;
  const body = await request.json();
  const { assignmentId, quizQuestions } = body;

  const classroom = await Classroom.findById(id).lean();
  if (!classroom || classroom.instructorId?.toString() !== user._id?.toString()) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const update = {};
  if (quizQuestions) update.quizQuestions = quizQuestions;

  const assignment = await Assignment.findByIdAndUpdate(assignmentId, update, { new: true }).lean();
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, assignment });
}

export const PATCH = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePatch);
export const dynamic = "force-dynamic";
