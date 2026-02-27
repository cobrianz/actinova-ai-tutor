// src/app/api/reports/[id]/route.js

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling } from "@/lib/middleware";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function handleGet(request, { params }) {
    const { id } = await params;
    const user = request.user;

    try {
        const { db } = await connectToDatabase();
        const report = await db.collection("reports").findOne({
            _id: new ObjectId(id),
            userId: new ObjectId(user._id),
        });

        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            report: {
                ...report,
                _id: report._id.toString(),
                userId: report.userId.toString(),
                createdAt: report.createdAt.toISOString(),
                updatedAt: report.updatedAt.toISOString(),
            }
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
    }
}

async function handlePatch(request, { params }) {
    const { id } = await params;
    const user = request.user;

    try {
        const body = await request.json();
        const { fullContent, sections, title } = body;

        const { db } = await connectToDatabase();

        const updateData = { updatedAt: new Date() };
        if (fullContent !== undefined) updateData.fullContent = fullContent;
        if (sections !== undefined) updateData.sections = sections;
        if (title !== undefined) updateData.title = title;

        const result = await db.collection("reports").updateOne(
            { _id: new ObjectId(id), userId: new ObjectId(user._id) },
            { $set: updateData }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
    }
}

async function handleDelete(request, { params }) {
    const { id } = await params;
    const user = request.user;

    try {
        const { db } = await connectToDatabase();
        await db.collection("reports").deleteOne({
            _id: new ObjectId(id),
            userId: new ObjectId(user._id),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
    }
}

export const GET = withErrorHandling(withAuth(handleGet));
export const PATCH = withErrorHandling(withAuth(handlePatch));
export const DELETE = withErrorHandling(withAuth(handleDelete));
