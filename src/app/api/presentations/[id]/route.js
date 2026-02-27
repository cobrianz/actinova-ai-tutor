// src/app/api/presentations/[id]/route.js

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling } from "@/lib/middleware";
import PptxGenJs from "pptxgenjs";

async function handleGet(request, { params }) {
  const user = request.user;
  const { id } = await params;

  try {
    const { db } = await connectToDatabase();

    // Get presentation
    const presentation = await db.collection("presentations").findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(user._id),
    });

    if (!presentation) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }

    // Check if download is requested
    const url = new URL(request.url);
    const download = url.searchParams.get("download") === "true";

    if (download) {
      // Return presentation data for client-side PPTX generation via html2canvas
      return NextResponse.json({
        success: true,
        presentation: {
          ...presentation,
          _id: presentation._id.toString(),
          createdAt: presentation.createdAt.toISOString(),
          updatedAt: presentation.updatedAt.toISOString(),
        }
      });
    }

    // Return presentation data
    return NextResponse.json({
      success: true,
      presentation: {
        ...presentation,
        _id: presentation._id.toString(),
        createdAt: presentation.createdAt.toISOString(),
        updatedAt: presentation.updatedAt.toISOString(),
      }
    });

  } catch (error) {
    console.error("Presentation fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch presentation" },
      { status: 500 }
    );
  }
}

async function handleDelete(request, { params }) {
  const user = request.user;
  const { id } = await params;

  try {
    const { db } = await connectToDatabase();

    const result = await db.collection("presentations").deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(user._id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Presentation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Presentation deleted" });

  } catch (error) {
    console.error("Presentation deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete presentation" },
      { status: 500 }
    );
  }
}

async function handlePatch(request, { params }) {
  const user = request.user;
  const { id } = await params;

  try {
    const body = await request.json();
    const { db } = await connectToDatabase();

    // Validate minimal fields
    const update = {};
    if (body.slides) update.slides = body.slides;
    if (body.title) update.title = body.title;
    if (body.description) update.description = body.description;
    update.updatedAt = new Date();

    const result = await db.collection("presentations").updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(user._id) },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Presentation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Presentation updated" });
  } catch (error) {
    console.error("Presentation update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update presentation" }, { status: 500 });
  }
}

export const GET = withErrorHandling(withAuth(handleGet));
export const DELETE = withErrorHandling(withAuth(handleDelete));
export const PATCH = withErrorHandling(withAuth(handlePatch));
export const runtime = "nodejs";
