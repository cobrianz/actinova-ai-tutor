import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import Enrollment from "@/models/Enrollment";
import Assignment from "@/models/Assignment";
import StudentProgress from "@/models/StudentProgress";
import crypto from "crypto";
import mongoose from "mongoose";
import { PRODUCTS } from "@/lib/planLimits";

function generateInviteCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function handlePost(request) {
  const { db } = await connectToDatabase();
  const user = request.user;

  if (user.role === "student") {
    return NextResponse.json(
      { error: "Only instructors can create classrooms", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  // Fetch user for fresh credit count
  const freshUser = await db.collection("users").findOne(
    { _id: new mongoose.Types.ObjectId(user._id) }
  );

  if (!freshUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if user is premium
  const isPremium =
    freshUser.isPremium ||
    (freshUser.subscription &&
      (freshUser.subscription.plan === "pro" || freshUser.subscription.plan === "enterprise") &&
      freshUser.subscription.status === "active");

  const product = PRODUCTS.find((p) => p.id === "classroom_creation");
  const cost = product?.creditCost || 25;

  if (!isPremium) {
    const currentCredits = freshUser.credits || 0;
    if (currentCredits < cost) {
      return NextResponse.json(
        {
          error: `Insufficient credits to create a classroom. Classroom creation costs ${cost} credits.`,
          required: cost,
          available: currentCredits,
          code: "INSUFFICIENT_CREDITS"
        },
        { status: 402 }
      );
    }

    // Deduct credits
    await db.collection("users").updateOne(
      { _id: new mongoose.Types.ObjectId(user._id) },
      {
        $inc: { credits: -cost },
        $push: {
          billingHistory: {
            type: "credit_usage",
            itemType: "classroom_creation",
            creditsSpent: cost,
            createdAt: new Date(),
          },
        },
      }
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

  if (startDate && new Date(startDate) < new Date(new Date().toDateString())) {
    return NextResponse.json(
      { error: "Start date cannot be in the past", code: "VALIDATION_ERROR" },
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
    academicLevel: academicLevel || "undergraduate",
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
    const results = await Classroom.aggregate([
      {
        $match: {
          instructorId: new mongoose.Types.ObjectId(user._id),
          isActive: true,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "enrollments",
          let: { classId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$classroomId", "$$classId"] },
                    { $eq: ["$status", "active"] },
                  ],
                },
              },
            },
          ],
          as: "studentsList",
        },
      },
      {
        $lookup: {
          from: "assignments",
          let: { classId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$classroomId", "$$classId"] },
                    { $eq: ["$isActive", true] },
                  ],
                },
              },
            },
          ],
          as: "assignmentsList",
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          subject: 1,
          inviteCode: 1,
          maxStudents: 1,
          semester: 1,
          academicLevel: 1,
          gradingScheme: 1,
          prerequisites: 1,
          syllabus: 1,
          schedule: 1,
          startDate: 1,
          durationWeeks: 1,
          settings: 1,
          createdAt: 1,
          updatedAt: 1,
          studentCount: { $size: "$studentsList" },
          assignmentCount: { $size: "$assignmentsList" },
        },
      },
    ]);

    const formattedClassrooms = results.map((c) => ({
      ...c,
      id: c._id.toString(),
      _id: undefined,
      instructorId: user._id.toString(),
      isInstructor: true,
    }));

    return NextResponse.json({ success: true, classrooms: formattedClassrooms, role: "instructor" });
  }

  // Student: list enrolled classrooms via aggregation on Enrollment
  const results = await Enrollment.aggregate([
    {
      $match: {
        studentId: new mongoose.Types.ObjectId(user._id),
        status: "active",
      },
    },
    {
      $lookup: {
        from: "classrooms",
        localField: "classroomId",
        foreignField: "_id",
        as: "classInfo",
      },
    },
    { $unwind: "$classInfo" },
    {
      $match: {
        "classInfo.isActive": true,
      },
    },
    { $sort: { "classInfo.createdAt": -1 } },
    {
      $lookup: {
        from: "assignments",
        let: { classId: "$classroomId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$classroomId", "$$classId"] },
                  { $eq: ["$isActive", true] },
                ],
              },
            },
          },
        ],
        as: "assignmentsList",
      },
    },
    {
      $lookup: {
        from: "assignments",
        let: { classId: "$classroomId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$classroomId", "$$classId"] },
                  { $eq: ["$isActive", true] },
                  { $gt: ["$dueDate", new Date()] },
                ],
              },
            },
          },
        ],
        as: "dueAssignmentsList",
      },
    },
    {
      $project: {
        _id: 0,
        id: "$classInfo._id",
        name: "$classInfo.name",
        description: "$classInfo.description",
        subject: "$classInfo.subject",
        inviteCode: "$classInfo.inviteCode",
        maxStudents: "$classInfo.maxStudents",
        semester: "$classInfo.semester",
        academicLevel: "$classInfo.academicLevel",
        gradingScheme: "$classInfo.gradingScheme",
        prerequisites: "$classInfo.prerequisites",
        syllabus: "$classInfo.syllabus",
        schedule: "$classInfo.schedule",
        startDate: "$classInfo.startDate",
        durationWeeks: "$classInfo.durationWeeks",
        settings: "$classInfo.settings",
        createdAt: "$classInfo.createdAt",
        updatedAt: "$classInfo.updatedAt",
        instructorId: "$classInfo.instructorId",
        assignmentCount: { $size: "$assignmentsList" },
        dueAssignments: { $size: "$dueAssignmentsList" },
      },
    },
  ]);

  const formattedClassrooms = results.map((c) => ({
    ...c,
    id: c.id.toString(),
    instructorId: c.instructorId.toString(),
    isInstructor: false,
  }));

  return NextResponse.json({ success: true, classrooms: formattedClassrooms, role: "student" });
}

export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const dynamic = "force-dynamic";
