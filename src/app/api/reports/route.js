// src/app/api/reports/route.js

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling } from "@/lib/middleware";

async function handleGet(request) {
    const user = request.user;
    const userId = user._id;

    try {
        const { db } = await connectToDatabase();
        const reports = await db.collection("reports")
            .find({ userId: new ObjectId(userId) })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({
            success: true,
            reports: reports.map(r => ({
                ...r,
                _id: r._id.toString(),
                userId: r.userId.toString(),
                createdAt: r.createdAt.toISOString(),
                updatedAt: r.updatedAt.toISOString(),
            }))
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
    }
}

export const GET = withErrorHandling(withAuth(handleGet));
