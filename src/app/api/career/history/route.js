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

// POST /api/career/history  — with deduplication for resume autosaves
async function saveHistoryHandler(req) {
    await dbConnect();
    const userId = req.user._id;
    const body = await req.json();
    const { id, type, title, data, metadata } = body;

    if (!type || !title || !data) {
        return NextResponse.json({ error: "Type, title, and data are required" }, { status: 400 });
    }

    try {
        // For autosaved resume drafts, upsert on userId + type + title so we don't create duplicates.
        // For interview / network / skill-gap sessions we always want a fresh record.
        const alwaysInsert = ["interview", "network", "skill-gap"];
        if (alwaysInsert.includes(type)) {
            const newHistory = new CareerHistory({ userId, type, title, data, metadata });
            await newHistory.save();
            return NextResponse.json(newHistory, { status: 201 });
        }

        // Update by specific ID if provided to prevent duplicates when renaming
        if (id) {
            const updated = await CareerHistory.findOneAndUpdate(
                { _id: id, userId },
                { $set: { title, data, metadata, updatedAt: new Date() } },
                { new: true }
            );
            if (updated) return NextResponse.json(updated, { status: 200 });
        }

        // Upsert: update if same user + type + title exists, otherwise create
        const record = await CareerHistory.findOneAndUpdate(
            { userId, type, title },
            { $set: { data, metadata, updatedAt: new Date() } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return NextResponse.json(record, { status: 200 });
    } catch (error) {
        console.error("Save history error:", error);
        return NextResponse.json({ error: "Failed to save history" }, { status: 500 });
    }
}

export const GET = combineMiddleware(withAuth)(getHistoryHandler);
export const DELETE = combineMiddleware(withAuth)(deleteHistoryHandler);
export const POST = combineMiddleware(withAuth)(saveHistoryHandler);
