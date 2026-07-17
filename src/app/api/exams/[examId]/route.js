export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

async function handleGet(request, { params }) {
  const user = request.user;
  const { examId } = await params;

  if (!examId || !ObjectId.isValid(examId)) {
    return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });
  }

  const { db } = await connectToDatabase();
  const exam = await db.collection("exams").findOne({
    _id: new ObjectId(examId),
    userId: new ObjectId(user._id),
  });

  if (!exam) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    exam: { ...exam, _id: exam._id.toString(), userId: exam.userId?.toString() },
  });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
