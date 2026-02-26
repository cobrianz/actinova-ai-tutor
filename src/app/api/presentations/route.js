// src/app/api/presentations/route.js

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling } from "@/lib/middleware";

async function handleGet(request) {
  const user = request.user;

  try {
    const { db } = await connectToDatabase();
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page")) || 1;
    const limit = parseInt(url.searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    // Get presentations
    const presentations = await db.collection("presentations")
      .find({ userId: new ObjectId(user._id) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count
    const total = await db.collection("presentations").countDocuments({
      userId: new ObjectId(user._id)
    });

    return NextResponse.json({
      success: true,
      presentations: presentations.map(p => ({
        ...p,
        _id: p._id.toString(),
        userId: p.userId.toString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    });

  } catch (error) {
    console.error("Presentations fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch presentations" },
      { status: 500 }
    );
  }
}

export const GET = withErrorHandling(withAuth(handleGet));
export const runtime = "nodejs";
