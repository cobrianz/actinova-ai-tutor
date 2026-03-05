import { NextResponse } from "next/server";
import { withErrorHandling, combineMiddleware, withAuth } from "@/lib/middleware";
import CareerHistory from "@/models/CareerHistory";
import dbConnect from "@/lib/dbConnect";

// GET /api/career/history?type=resume
async function getHistoryHandler(req) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const userId = req.user._id;

    const query = { userId };
    if (type) {
        query.type = type;
    }

    try {
        const history = await CareerHistory.find(query)
            .sort({ createdAt: -1 })
            .limit(20);
        return NextResponse.json(history);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}

// DELETE /api/career/history?id=...
async function deleteHistoryHandler(req) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = req.user._id;

    if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    try {
        const result = await CareerHistory.findOneAndDelete({ _id: id, userId });
        if (!result) {
            return NextResponse.json({ error: "History item not found" }, { status: 404 });
        }
        return NextResponse.json({ message: "History item deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete history" }, { status: 500 });
    }
}

// POST /api/career/history
async function saveHistoryHandler(req) {
    await dbConnect();
    const userId = req.user._id;
    const body = await req.json();
    const { type, title, data, metadata } = body;

    if (!type || !title || !data) {
        return NextResponse.json({ error: "Type, title, and data are required" }, { status: 400 });
    }

    try {
        const newHistory = new CareerHistory({
            userId,
            type,
            title,
            data,
            metadata
        });
        await newHistory.save();
        return NextResponse.json(newHistory, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to save history" }, { status: 500 });
    }
}

export const GET = combineMiddleware(withAuth)(getHistoryHandler);
export const DELETE = combineMiddleware(withAuth)(deleteHistoryHandler);
export const POST = combineMiddleware(withAuth)(saveHistoryHandler);
