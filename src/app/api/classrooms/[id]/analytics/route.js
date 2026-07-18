import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";
import Assignment from "@/models/Assignment";
import StudentProgress from "@/models/StudentProgress";
import Enrollment from "@/models/Enrollment";

async function handleGet(request, { params }) {
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

  const assignments = await Assignment.find({
    classroomId: id,
    isActive: true,
  })
    .sort({ weekNumber: 1, createdAt: 1 })
    .lean();

  const enrollments = await Enrollment.find({
    classroomId: id,
    status: "active",
  }).lean();

  const studentIds = enrollments.map((e) => e.studentId);

  const allProgress = await StudentProgress.find({ classroomId: id }).lean();

  const totalStudents = studentIds.length;
  const activeStudentIds = new Set();
  allProgress.forEach((p) => {
    if (p.status !== "not_started") {
      activeStudentIds.add(p.studentId.toString());
    }
  });
  const activeStudents = activeStudentIds.size;

  const totalAssignments = assignments.length;

  const totalScores = allProgress.filter((p) => p.score != null);
  const avgScore =
    totalScores.length > 0
      ? Math.round(
          (totalScores.reduce((sum, p) => sum + p.score, 0) /
            totalScores.length) *
            100
        ) / 100
      : 0;

  const totalTimeSpent = allProgress.reduce(
    (sum, p) => sum + (p.timeSpentMinutes || 0),
    0
  );

  const completedCount = allProgress.filter(
    (p) => p.status === "completed"
  ).length;
  const avgCompletionRate =
    totalStudents > 0 && totalAssignments > 0
      ? Math.round(
          (completedCount / (totalStudents * totalAssignments)) * 100
        )
      : 0;

  const assignmentAnalytics = assignments.map((a) => {
    const aid = a._id.toString();
    const progressForAssignment = allProgress.filter(
      (p) => p.assignmentId.toString() === aid
    );
    const scoredProgress = progressForAssignment.filter(
      (p) => p.score != null
    );
    const avgScoreA =
      scoredProgress.length > 0
        ? Math.round(
            (scoredProgress.reduce((sum, p) => sum + p.score, 0) /
              scoredProgress.length) *
              100
          ) / 100
        : 0;
    const completedA = progressForAssignment.filter(
      (p) => p.status === "completed"
    ).length;
    const completionRateA =
      progressForAssignment.length > 0
        ? Math.round((completedA / progressForAssignment.length) * 100)
        : 0;

    return {
      id: aid,
      title: a.title,
      type: a.type,
      avgScore: avgScoreA,
      completionRate: completionRateA,
      submissionCount: scoredProgress.length,
    };
  });

  const progressOverTime = [];
  const startDate = classroom.startDate
    ? new Date(classroom.startDate)
    : null;

  if (startDate && totalAssignments > 0) {
    const now = new Date();
    const totalWeeks = Math.max(
      1,
      Math.ceil((now - startDate) / (7 * 24 * 60 * 60 * 1000))
    );

    for (let w = 0; w <= totalWeeks; w++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const relevantAssignments = assignments.filter((a) => {
        const aDate = new Date(a.createdAt);
        return aDate >= weekStart && aDate < weekEnd;
      });

      if (relevantAssignments.length === 0) continue;

      const relevantAIds = new Set(
        relevantAssignments.map((a) => a._id.toString())
      );
      const relevantProgress = allProgress.filter((p) =>
        relevantAIds.has(p.assignmentId.toString())
      );

      const avgProgress =
        relevantProgress.length > 0
          ? Math.round(
              relevantProgress.reduce((sum, p) => sum + (p.progress || 0), 0) /
                relevantProgress.length
            )
          : 0;

      progressOverTime.push({
        week: w + 1,
        weekStart: weekStart.toISOString().split("T")[0],
        avgProgress,
        assignmentCount: relevantAssignments.length,
      });
    }
  }

  const scoredAssignments = allProgress.filter((p) => p.score != null);
  const totalTimeForAvg = scoredAssignments.reduce(
    (sum, p) => sum + (p.timeSpentMinutes || 0),
    0
  );
  const avgTimePerAssignment =
    scoredAssignments.length > 0
      ? Math.round(totalTimeForAvg / scoredAssignments.length)
      : 0;

  const completionByType = {};
  assignments.forEach((a) => {
    if (!completionByType[a.type]) {
      completionByType[a.type] = { total: 0, completed: 0 };
    }
    const progressForA = allProgress.filter(
      (p) => p.assignmentId.toString() === a._id.toString()
    );
    completionByType[a.type].total += progressForA.length;
    completionByType[a.type].completed += progressForA.filter(
      (p) => p.status === "completed"
    ).length;
  });

  const engagementMetrics = {
    avgTimePerAssignment,
    completionByType: Object.entries(completionByType).map(
      ([type, data]) => ({
        type,
        total: data.total,
        completed: data.completed,
        completionRate:
          data.total > 0
            ? Math.round((data.completed / data.total) * 100)
            : 0,
      })
    ),
  };

  const atRiskStudents = [];
  const progressByStudent = {};
  allProgress.forEach((p) => {
    const sid = p.studentId.toString();
    if (!progressByStudent[sid]) progressByStudent[sid] = [];
    progressByStudent[sid].push(p);
  });

  for (const studentId of studentIds) {
    const sid = studentId.toString();
    const studentProgress = progressByStudent[sid] || [];
    const totalAssignmentsForStudent = studentProgress.length;

    if (totalAssignmentsForStudent < 1) continue;

    const avgProgress =
      studentProgress.reduce((sum, p) => sum + (p.progress || 0), 0) /
      totalAssignmentsForStudent;

    if (avgProgress < 30) {
      const enrollment = enrollments.find(
        (e) => e.studentId.toString() === sid
      );
      atRiskStudents.push({
        studentId: sid,
        avgProgress: Math.round(avgProgress),
        totalAssignments: totalAssignmentsForStudent,
        totalTimeMinutes: studentProgress.reduce(
          (sum, p) => sum + (p.timeSpentMinutes || 0),
          0
        ),
        enrolledAt: enrollment?.joinedAt || null,
      });
    }
  }

  return NextResponse.json({
    success: true,
    overview: {
      totalStudents,
      activeStudents,
      totalAssignments,
      avgCompletionRate,
      avgScore,
      totalTimeSpent,
    },
    assignmentAnalytics,
    progressOverTime,
    engagementMetrics,
    atRisk: atRiskStudents,
  });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const dynamic = "force-dynamic";
