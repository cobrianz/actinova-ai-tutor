import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { ObjectId } from "mongodb";

async function handleGet(request) {
    const user = request.user;
    const userId = user._id;

    try {
        const { db } = await connectToDatabase();
        const now = new Date();

        // 1. Fetch due card sets (Flashcards)
        // We look for cardSets where at least one card is due
        const cardSets = await db.collection("cardSets").find({
            userId: new ObjectId(userId),
            "cards.srs.dueDate": { $lte: now.toISOString() }
        }).toArray();

        const dueCards = [];
        cardSets.forEach(set => {
            set.cards.forEach(card => {
                if (card.srs && new Date(card.srs.dueDate) <= now) {
                    dueCards.push({
                        type: "flashcard",
                        setId: set._id.toString(),
                        setTitle: set.title,
                        cardId: card._id || card.id,
                        question: card.question,
                        answer: card.answer,
                        explanation: card.explanation,
                        srs: card.srs
                    });
                }
            });
        });

        // 2. Fetch due Quizzes
        // Quizzes are stored in the "tests" collection (model name Test)
        const dueQuizzes = await db.collection("tests").find({
            createdBy: new ObjectId(userId),
            "srs.dueDate": { $lte: now }
        }).toArray();

        const formattedQuizzes = dueQuizzes.map(quiz => ({
            type: "quiz",
            id: quiz._id.toString(),
            title: quiz.title,
            course: quiz.course,
            questionCount: quiz.questions?.length || 0,
            srs: quiz.srs
        }));

        return NextResponse.json({
            cards: dueCards,
            quizzes: formattedQuizzes,
            totalDue: dueCards.length + formattedQuizzes.length
        });

    } catch (error) {
        console.error("Error fetching due items:", error);
        return NextResponse.json({ error: "Failed to fetch due items" }, { status: 500 });
    }
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const dynamic = "force-dynamic";
