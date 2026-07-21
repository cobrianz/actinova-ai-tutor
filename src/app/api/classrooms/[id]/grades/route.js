import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import Assignment from "@/models/Assignment";
import StudentProgress from "@/models/StudentProgress";
import Enrollment from "@/models/Enrollment";

function computeLetterGrade(percentage, scheme) {
  if (scheme === "passfail") {
    return percentage >= 60 ? "Pass" : "Fail";
  }
  if (scheme === "gpa") {
    if (percentage >= 93) return "4.0";
    if (percentage >= 90) return "3.7";
    if (percentage >= 87) return "3.3";
    if (percentage >= 83) return "3.0";
    if (percentage >= 80) return "2.7";
    if (percentage >= 77) return "2.3";
    if (percentage >= 73) return "2.0";
    if (percentage >= 70) return "1.7";
    if (percentage >= 67) return "1.3";
    if (percentage >= 63) return "1.0";
    return "0.0";
  }
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "F";
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

  const assignments = await Assignment.find({
    classroomId: id,
    isActive: true,
  })
    .sort({ weekNumber: 1, createdAt: 1 })
    .lean();

  if (isInstructor) {
    const enrollments = await Enrollment.find({
      classroomId: id,
      status: "active",
    }).lean();

    const studentIds = enrollments.map((e) => e.studentId);

    const studentsData = await Enrollment.find({
      classroomId: id,
      status: "active",
    })
      .populate("studentId", "name email")
      .lean();

    const allProgress = await StudentProgress.find({ classroomId: id }).lean();

    const progressByStudent = {};
    allProgress.forEach((p) => {
      const sid = p.studentId.toString();
      if (!progressByStudent[sid]) progressByStudent[sid] = {};
      progressByStudent[sid][p.assignmentId.toString()] = p;
    });

    const gradingScheme = classroom.gradingScheme || "percentage";

    const students = studentsData.map((enrollment) => {
      const student = enrollment.studentId;
      const sid = student._id.toString();
      const grades = {};
      let weightedSum = 0;
      let totalWeight = 0;

      assignments.forEach((a) => {
        const aid = a._id.toString();
        const progress = progressByStudent[sid]?.[aid];
        const score = progress?.score ?? null;
        const maxScore = a.maxScore || 100;
        const percentage = score !== null ? (score / maxScore) * 100 : null;
        const weight = a.weight || 1;

        grades[aid] = {
          score,
          maxScore,
          percentage,
          weight,
          status: progress?.status || "not_started",
          feedback: progress?.feedback || "",
        };

        if (percentage !== null) {
          weightedSum += (percentage * weight);
          totalWeight += weight;
        }
      });

      const weightedAverage = totalWeight > 0
        ? Math.round((weightedSum / totalWeight) * 100) / 100
        : null;
      const letterGrade = weightedAverage !== null
        ? computeLetterGrade(weightedAverage, gradingScheme)
        : "N/A";

      return {
        id: sid,
        name: student.name,
        email: student.email,
        grades,
        weightedAverage,
        totalWeight,
        letterGrade,
      };
    });

    const assignmentList = assignments.map((a) => ({
      id: a._id.toString(),
      title: a.title,
      type: a.type,
      maxScore: a.maxScore || 100,
      weight: a.weight || 1,
    }));

    const searchParams = request.nextUrl.searchParams;
    if (searchParams.get("format") === "csv") {
      const assignmentNames = assignments.map((a) => a.title);
      const csvHeader = ["Name", "Email", ...assignmentNames, "Weighted Average", "Letter Grade"];
      const csvRows = students.map((s) => [
        s.name,
        s.email,
        ...assignments.map((a) => s.grades[a._id.toString()]?.score ?? ""),
        s.weightedAverage ?? "",
        s.letterGrade,
      ]);
      const csv = [
        csvHeader.join(","),
        ...csvRows.map((r) =>
          r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="grades-${id}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      students,
      assignments: assignmentList,
      classroom: {
        name: classroom.name,
        gradingScheme,
      },
    });
  }

  // Student view: return own grades only
  const myProgress = await StudentProgress.find({
    classroomId: id,
    studentId: user._id,
  }).lean();

  const progressByAssignment = {};
  myProgress.forEach((p) => {
    progressByAssignment[p.assignmentId.toString()] = p;
  });

  const gradingScheme = classroom.gradingScheme || "percentage";
  const grades = {};
  let weightedSum = 0;
  let totalWeight = 0;

  assignments.forEach((a) => {
    const aid = a._id.toString();
    const progress = progressByAssignment[aid];
    const score = progress?.score ?? null;
    const maxScore = a.maxScore || 100;
    const percentage = score !== null ? (score / maxScore) * 100 : null;
    const weight = a.weight || 1;

    grades[aid] = {
      score,
      maxScore,
      percentage,
      weight,
      status: progress?.status || "not_started",
      feedback: progress?.feedback || "",
    };

    if (percentage !== null) {
      weightedSum += (percentage * weight);
      totalWeight += weight;
    }
  });

  const weightedAverage = totalWeight > 0
    ? Math.round((weightedSum / totalWeight) * 100) / 100
    : null;
  const letterGrade = weightedAverage !== null
    ? computeLetterGrade(weightedAverage, gradingScheme)
    : "N/A";

  return NextResponse.json({
    success: true,
    students: [{
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      grades,
      weightedAverage,
      totalWeight,
      letterGrade,
    }],
    assignments: assignments.map((a) => ({
      id: a._id.toString(),
      title: a.title,
      type: a.type,
      maxScore: a.maxScore || 100,
      weight: a.weight || 1,
    })),
    classroom: {
      name: classroom.name,
      gradingScheme,
    },
  });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const dynamic = "force-dynamic";
