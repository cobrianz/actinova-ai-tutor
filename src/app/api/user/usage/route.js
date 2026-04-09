import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getTrackedUsageSummary } from "@/lib/usageSummary";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

async function handleGet(request) {
  const user = request.user;
  const { db } = await connectToDatabase();
  const usage = await getTrackedUsageSummary(db, user);
  return NextResponse.json(usage, { status: 200 });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
