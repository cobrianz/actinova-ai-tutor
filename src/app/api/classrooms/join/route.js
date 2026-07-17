import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import Enrollment from "@/models/Enrollment";

async function handlePost(request) {
  await connectToDatabase();
  const user = request.user;
  const body = await request.json();
  const { inviteCode } = body;

  if (!inviteCode?.trim()) {
    return NextResponse.json(
      { error: "Invite code is required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const classroom = await Classroom.findOne({
    inviteCode: inviteCode.trim().toUpperCase(),
    isActive: true,
  }).lean();

  if (!classroom) {
    return NextResponse.json(
      { error: "Invalid invite code", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const existing = await Enrollment.findOne({
    classroomId: classroom._id,
    studentId: user._id,
    status: "active",
  }).lean();

  if (existing) {
    return NextResponse.json(
      { error: "Already enrolled in this classroom", code: "DUPLICATE" },
      { status: 409 }
    );
  }

  const studentCount = await Enrollment.countDocuments({
    classroomId: classroom._id,
    status: "active",
  });

  if (studentCount >= classroom.maxStudents) {
    return NextResponse.json(
      { error: "Classroom is full", code: "FULL" },
      { status: 400 }
    );
  }

  await Enrollment.create({
    classroomId: classroom._id,
    studentId: user._id,
  });

  return NextResponse.json({
    success: true,
    classroom: {
      id: classroom._id.toString(),
      name: classroom.name,
      subject: classroom.subject,
    },
  });
}

export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
export const dynamic = "force-dynamic";
