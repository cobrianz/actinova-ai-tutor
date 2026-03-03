
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Newsletter from "@/models/Newsletter";

export async function POST(request) {
    try {
        const { email } = await request.json();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: "Please provide a valid email address" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Upsert: if exists, update status to subscribed. If new, create.
        await Newsletter.findOneAndUpdate(
            { email: email.toLowerCase() },
            { email: email.toLowerCase(), status: "subscribed" },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return NextResponse.json({
            success: true,
            message: "Successfully subscribed to newsletter!",
        });
    } catch (error) {
        console.error("Newsletter subscription error:", error);
        return NextResponse.json(
            { error: "Failed to subscribe. Please try again later." },
            { status: 500 }
        );
    }
}
