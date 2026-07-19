import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { connectToDatabase } from "@/lib/mongodb";
import Classroom from "@/models/Classroom";

async function handleGet(request, { params }) {
  await connectToDatabase();
  const { id } = await params;

  const classroom = await Classroom.findById(id).select("openedWeeks").lean();
  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, openedWeeks: classroom.openedWeeks || [] });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const dynamic = "force-dynamic";
