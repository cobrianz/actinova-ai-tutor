import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import Enrollment from "@/models/Enrollment";
import Assignment from "@/models/Assignment";
import StudentProgress from "@/models/StudentProgress";
import crypto from "crypto";

function generateInviteCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function handlePost(request) {
  await connectToDatabase();
  const user = request.user;

  if (user.role === "student") {
    return NextResponse.json(
      { error: "Only instructors can create classrooms", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { name, description, subject, maxStudents, semester, academicLevel, gradingScheme, prerequisites, syllabus, schedule, startDate, durationWeeks, settings } = body;

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Classroom name is required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const classroom = await Classroom.create({
    instructorId: user._id,
    name: name.trim(),
    description: description?.trim() || "",
    subject: subject?.trim() || "",
    inviteCode: generateInviteCode(),
    maxStudents: maxStudents || 50,
    semester: semester?.trim() || "",
    academicLevel: academicLevel || "college",
    gradingScheme: gradingScheme || "percentage",
    prerequisites: prerequisites || [],
    syllabus: syllabus?.trim() || "",
    schedule: schedule || {},
    startDate: startDate || null,
    durationWeeks: durationWeeks || 0,
    settings: settings || {},
  });

  return NextResponse.json({
    success: true,
    classroom: {
      id: classroom._id.toString(),
      name: classroom.name,
      description: classroom.description,
      subject: classroom.subject,
      inviteCode: classroom.inviteCode,
      maxStudents: classroom.maxStudents,
      createdAt: classroom.createdAt,
    },
  });
}

async function handleGet(request) {
  await connectToDatabase();
  const user = request.user;
  const { searchParams } = new URL(request.url);
  const classroomId = searchParams.get("id");

  if (classroomId) {
    const classroom = await Classroom.findOne({
      _id: classroomId,
      isActive: true,
    }).lean();

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    const isInstructor = classroom.instructorId.toString() === user._id.toString();
    const isEnrolled = await Enrollment.findOne({
      classroomId,
      studentId: user._id,
      status: "active",
    }).lean();

    if (!isInstructor && !isEnrolled) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const studentCount = await Enrollment.countDocuments({
      classroomId,
      status: "active",
    });

    const assignments = await Assignment.find({
      classroomId,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    let progress = null;
    if (!isInstructor) {
      progress = await StudentProgress.find({
        classroomId,
        studentId: user._id,
      }).lean();
    }

    return NextResponse.json({
      success: true,
      classroom: {
        ...classroom,
        _id: undefined,
        id: classroom._id.toString(),
        instructorId: classroom.instructorId.toString(),
        studentCount,
        assignments: assignments.map((a) => ({
          ...a,
          _id: undefined,
          id: a._id.toString(),
          courseId: a.courseId?.toString() || null,
          createdBy: a.createdBy.toString(),
        })),
        progress: progress?.map((p) => ({
          ...p,
          _id: undefined,
          id: p._id.toString(),
          assignmentId: p.assignmentId.toString(),
        })) || [],
        isInstructor,
      },
    });
  }

  // List all classrooms for this user
  if (user.role === "instructor" || user.role === "admin") {
    const classrooms = await Classroom.find({
      instructorId: user._id,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    const result = await Promise.all(
      classrooms.map(async (c) => {
        const studentCount = await Enrollment.countDocuments({
          classroomId: c._id,
          status: "active",
        });
        const assignmentCount = await Assignment.countDocuments({
          classroomId: c._id,
          isActive: true,
        });
        return {
          ...c,
          _id: undefined,
          id: c._id.toString(),
          instructorId: c.instructorId.toString(),
          studentCount,
          assignmentCount,
          isInstructor: true,
        };
      })
    );

    return NextResponse.json({ success: true, classrooms: result, role: "instructor" });
  }

  // Student: list enrolled classrooms
  const enrollments = await Enrollment.find({
    studentId: user._id,
    status: "active",
  }).lean();

  const classroomIds = enrollments.map((e) => e.classroomId);

  const classrooms = await Classroom.find({
    _id: { $in: classroomIds },
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  const result = await Promise.all(
    classrooms.map(async (c) => {
      const assignmentCount = await Assignment.countDocuments({
        classroomId: c._id,
        isActive: true,
      });
      const dueAssignments = await Assignment.countDocuments({
        classroomId: c._id,
        isActive: true,
        dueDate: { $gt: new Date() },
      });
      return {
        ...c,
        _id: undefined,
        id: c._id.toString(),
        instructorId: c.instructorId.toString(),
        assignmentCount,
        dueAssignments,
        isInstructor: false,
      };
    })
  );

  return NextResponse.json({ success: true, classrooms: result, role: "student" });
}

export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const dynamic = "force-dynamic";
