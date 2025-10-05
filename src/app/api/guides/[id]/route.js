import { NextResponse } from "next/server";
import { withAuth, withErrorHandling } from "@/lib/middleware";
import connectToMongoose from "@/lib/mongoose";
import Guide from "@/models/Guide";

async function updateGuideHandler(request, { params }) {
  await connectToMongoose();
  const user = request.user;
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const update = await request.json();
    const guide = await Guide.findOneAndUpdate({ _id: params.id, createdBy: user._id }, update, { new: true });
    if (!guide) return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    return NextResponse.json(guide);
  } catch (e) {
    console.error("Error updating guide:", e);
    return NextResponse.json({ error: "Failed to update guide" }, { status: 500 });
  }
}

async function deleteGuideHandler(request, { params }) {
  await connectToMongoose();
  const user = request.user;
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const result = await Guide.deleteOne({ _id: params.id, createdBy: user._id });
    if (result.deletedCount === 0) return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting guide:", e);
    return NextResponse.json({ error: "Failed to delete guide" }, { status: 500 });
  }
}

export const PUT = withErrorHandling(withAuth(updateGuideHandler));
export const DELETE = withErrorHandling(withAuth(deleteGuideHandler));


