export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import crypto from "crypto";

async function handlePost(request) {
  const user = request.user;
  const { planId } = await request.json();

  if (!planId || !ObjectId.isValid(planId)) {
    return NextResponse.json({ error: "Valid planId is required" }, { status: 400 });
  }

  const { db } = await connectToDatabase();

  const plan = await db.collection("library").findOne({
    _id: new ObjectId(planId),
    userId: new ObjectId(user._id),
    format: "study_plan",
  });

  if (!plan) {
    return NextResponse.json({ error: "Study plan not found" }, { status: 404 });
  }

  const shareId = crypto.randomUUID();

  const publicPlan = {
    shareId,
    title: plan.title,
    topic: plan.topic || plan.originalTopic,
    originalTopic: plan.originalTopic,
    overview: plan.overview,
    difficulty: plan.difficulty,
    durationWeeks: plan.durationWeeks,
    weeks: plan.weeks,
    totalTasks: plan.totalTasks || 0,
    completedTasks: 0,
    progress: 0,
    selectedCourseNames: plan.selectedCourseNames || [],
    sourcePlanId: planId.toString(),
    sharedByName: user.name || user.fullName || "A User",
    createdAt: new Date(),
  };

  const existing = await db.collection("shared_plans").findOne({ sourcePlanId: planId.toString() });

  if (existing) {
    await db.collection("shared_plans").updateOne(
      { _id: existing._id },
      { $set: { ...publicPlan, createdAt: existing.createdAt } }
    );
  } else {
    await db.collection("shared_plans").insertOne(publicPlan);
  }

  const shareUrl = `/shared/study-plan/${shareId}`;

  return NextResponse.json({ success: true, shareId, shareUrl });
}

async function handleGet(request) {
  const { searchParams } = new URL(request.url);
  const shareId = searchParams.get("shareId");

  if (!shareId) {
    return NextResponse.json({ error: "shareId is required" }, { status: 400 });
  }

  const { db } = await connectToDatabase();

  const plan = await db.collection("shared_plans").findOne({ shareId });

  if (!plan) {
    return NextResponse.json({ error: "Shared plan not found" }, { status: 404 });
  }

  const { _id, ...publicPlan } = plan;
  return NextResponse.json({ success: true, plan: publicPlan });
}

export const POST = combineMiddleware(withErrorHandling, withAuth)(handlePost);
export const GET = combineMiddleware(withErrorHandling)(handleGet);
