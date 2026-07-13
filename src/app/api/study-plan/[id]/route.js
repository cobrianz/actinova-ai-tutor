export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

async function handleGet(request, { params }) {
  const user = request.user;
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid study plan ID" }, { status: 400 });
  }

  const { db } = await connectToDatabase();

  const plan = await db.collection("library").findOne({
    _id: new ObjectId(id),
    userId: new ObjectId(user._id),
    format: "study_plan",
  });

  if (!plan) {
    return NextResponse.json({ error: "Study plan not found" }, { status: 404 });
  }

  // Update lastAccessed
  await db.collection("library").updateOne(
    { _id: new ObjectId(id) },
    { $set: { lastAccessed: new Date() } }
  );

  return NextResponse.json({ success: true, plan });
}

async function handleDelete(request, { params }) {
  const user = request.user;
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid study plan ID" }, { status: 400 });
  }

  const { db } = await connectToDatabase();

  const result = await db.collection("library").deleteOne({
    _id: new ObjectId(id),
    userId: new ObjectId(user._id),
    format: "study_plan",
  });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Study plan not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Study plan deleted" });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const DELETE = combineMiddleware(withErrorHandling, withAuth)(handleDelete);
