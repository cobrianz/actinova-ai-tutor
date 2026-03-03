import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling } from "@/lib/middleware";
import { validateStructure } from "@/services/outlineStructureValidator";

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

        const validationResults = validateStructure(report);

        return NextResponse.json({
            success: true,
            results: validationResults
        });
    } catch (error) {
        console.error("Validation error:", error);
        return NextResponse.json({ error: "Failed to validate report structure" }, { status: 500 });
    }
}

export const GET = withErrorHandling(withAuth(handleGet));
