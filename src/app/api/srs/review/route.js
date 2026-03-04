import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { ObjectId } from "mongodb";
import { calculateNextReview } from "@/lib/srsUtils";

async function handlePost(request) {
    const user = request.user;
    const userId = user._id;

    try {
        const { type, id, setId, quality } = await request.json();

        if (quality === undefined || quality < 0 || quality > 5) {
            return NextResponse.json({ error: "Invalid quality score (0-5 required)" }, { status: 400 });
        }

        const { db } = await connectToDatabase();

        if (type === "flashcard") {
            if (!setId || !id) {
                return NextResponse.json({ error: "setId and id are required for flashcards" }, { status: 400 });
            }

            const cardSet = await db.collection("cardSets").findOne({
                _id: new ObjectId(setId),
                userId: new ObjectId(userId)
            });

            if (!cardSet) return NextResponse.json({ error: "Card set not found" }, { status: 404 });

            const cardIndex = cardSet.cards.findIndex(c => (c._id?.toString() || c.id?.toString()) === id.toString());
            if (cardIndex === -1) return NextResponse.json({ error: "Card not found in set" }, { status: 404 });

            const currentSrs = cardSet.cards[cardIndex].srs;
            const nextSrs = calculateNextReview(currentSrs, quality);

            // Update specific card in the array
            const updateKey = `cards.${cardIndex}.srs`;
            await db.collection("cardSets").updateOne(
                { _id: new ObjectId(setId) },
                { $set: { [updateKey]: nextSrs } }
            );

            return NextResponse.json({ success: true, nextReview: nextSrs.dueDate });

        } else if (type === "quiz") {
            const quiz = await db.collection("tests").findOne({
                _id: new ObjectId(id),
                createdBy: new ObjectId(userId)
            });

            if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

            const nextSrs = calculateNextReview(quiz.srs, quality);

            await db.collection("tests").updateOne(
                { _id: new ObjectId(id) },
                { $set: { srs: nextSrs } }
            );

            return NextResponse.json({ success: true, nextReview: nextSrs.dueDate });
        }

        return NextResponse.json({ error: "Invalid item type" }, { status: 400 });

    } catch (error) {
        console.error("Error submitting review:", error);
        return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
    }
}

export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
