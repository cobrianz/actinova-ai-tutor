import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { connectToDatabase } from "@/lib/mongodb";
import CourseMaterial from "@/models/CourseMaterial";

async function handleGet(request, { params }) {
  await connectToDatabase();
  const { id } = await params;
  const materials = await CourseMaterial.find({ classroomId: id })
    .populate("uploadedBy", "name email")
    .sort({ weekNumber: 1, createdAt: -1 })
    .lean();
  return NextResponse.json({ success: true, materials });
}

async function handlePost(request, { params }) {
  await connectToDatabase();
  const user = request.user;
  const { id } = await params;
  const { title, description, type, url, fileName, fileSize, weekNumber, category, isRequired } = await request.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const material = await CourseMaterial.create({
    classroomId: id,
    uploadedBy: user._id,
    title: title.trim(),
    description: description?.trim() || "",
    type: type || "document",
    url: url || "",
    fileName: fileName || "",
    fileSize: fileSize || 0,
    weekNumber: weekNumber || 0,
    category: category || "",
    isRequired: isRequired || false,
  });

  const populated = await material.populate("uploadedBy", "name email");
  return NextResponse.json({ success: true, material: populated });
}

export const GET = combineMiddleware(withErrorHandling)(handleGet);
export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
