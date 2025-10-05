import { NextResponse } from "next/server";
import { withAuth, withErrorHandling } from "@/lib/middleware";
import connectToMongoose from "@/lib/mongoose";
import Guide from "@/models/Guide";

async function listGuidesHandler(request) {
  await connectToMongoose();
  const user = request.user;
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const guides = await Guide.find({ createdBy: user._id }).sort({ createdAt: -1 });
    return NextResponse.json(guides);
  } catch (e) {
    console.error("Error listing guides:", e);
    return NextResponse.json({ error: "Failed to list guides" }, { status: 500 });
  }
}

async function createGuideHandler(request) {
  await connectToMongoose();
  const user = request.user;
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = await request.json();
    const guide = await Guide.create({ ...body, createdBy: user._id });
    return NextResponse.json(guide, { status: 201 });
  } catch (e) {
    console.error("Error creating guide:", e);
    return NextResponse.json({ error: "Failed to create guide" }, { status: 500 });
  }
}

const listHandler = withErrorHandling(withAuth(listGuidesHandler));
const createHandler = withErrorHandling(withAuth(createGuideHandler));

export const GET = listHandler;
export const POST = createHandler;


