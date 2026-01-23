// src/app/api/cards/generate/route.js

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Limits are now unified in planLimits.js
// const LIMITS = {
//   free: { cards: 8, monthlyGenerations: 2 },
//   premium: { cards: 40, monthlyGenerations: 20 },
// };

import { getUserPlanLimits } from "@/lib/planLimits";
import { checkAPILimit, trackAPIUsage } from "@/lib/planMiddleware";

export async function POST(request) {
  let userId = null;
  let isPremium = false;

  try {
    // ─── AUTH ───
    const authHeader = request.headers.get("authorization");
    let token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) token = (await cookies()).get("token")?.value;

    if (token) {
      try {
        const decoded = verifyToken(token);
        userId = decoded.id;
      } catch (err) {
        console.warn("Invalid token");
      }
    }

    // ─── INPUT ───
    const {
      topic,
      difficulty = "intermediate",
      existingCardSetId,
      additionalCards,
      existingCardCount,
    } = await request.json();
    if (!topic?.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }
    if (!["beginner", "intermediate", "advanced"].includes(difficulty)) {
      return NextResponse.json(
        { error: "Invalid difficulty" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // ─── USER & MONTHLY LIMITS (planMiddleware) ───
    let usageStatus = { used: 0, limit: 5, resetsOn: new Date().toLocaleDateString() };
    if (userId) {
      const limitCheck = await checkAPILimit(userId, "generate-flashcards");
      usageStatus = {
        used: limitCheck.currentUsage,
        limit: limitCheck.limit,
        resetsOn: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()
      };

      if (!limitCheck.withinLimit && limitCheck.limit !== -1) {
        return NextResponse.json(
          {
            error: "API rate limit exceeded",
            message: `You have reached your monthly limit of ${limitCheck.limit} flashcard generations`,
            remaining: 0,
            resetDate: usageStatus.resetsOn,
          },
          { status: 429 }
        );
      }
    }

    let currentLimits;
    if (userId) {
      const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
      isPremium = user?.subscription?.tier === "pro" || user?.subscription?.tier === "enterprise";
      currentLimits = getUserPlanLimits(user);
    } else {
      currentLimits = getUserPlanLimits(null);
    }

    const cardCount = additionalCards || currentLimits.flashcards;

    // ─── GENERATE FLASHCARDS ───
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.75,
      max_tokens: 8000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Generate EXACTLY ${cardCount} ${difficulty} flashcards for "${topic}".

Return ONLY valid JSON with this structure:
{
  "title": string,
  "level": "${difficulty}",
  "totalCards": ${cardCount},
  "cards": [
    {
      "id": number,
      "question": string,
      "answer": string,
      "explanation": string,
      "keyPoints": string[],
      "example": string,
      "category": "concept"|"tip"|"warning"|"practice",
      "difficulty": "${difficulty}",
      "srs": { "interval": 1, "repetitions": 0, "ease": 2.5, "dueDate": "${new Date().toISOString()}" }
    }
  ]
}

No markdown. Only JSON. Perfect for spaced repetition.`,
        },
        {
          role: "user",
          content: `Create ${cardCount} high-quality ${difficulty} flashcards for "${topic}" with deep explanations and examples.`,
        },
      ],
    });

    let flashcards;
    try {
      flashcards = JSON.parse(completion.choices[0].message.content.trim());
    } catch (e) {
      console.error("JSON parse failed, using fallback");
      flashcards = {
        title: `${topic} Flashcards`,
        level: difficulty,
        totalCards: cardCount,
        cards: [],
      };
    }

    // Ensure cards exist
    if (!Array.isArray(flashcards.cards) || flashcards.cards.length === 0) {
      flashcards.cards = Array(cardCount)
        .fill()
        .map((_, i) => ({
          id: i + 1,
          question: `Question ${i + 1}`,
          answer: "Answer",
          explanation: "Explanation",
          keyPoints: ["Point 1"],
          example: "Example",
          category: "concept",
          difficulty,
          srs: {
            interval: 1,
            repetitions: 0,
            ease: 2.5,
            dueDate: new Date().toISOString(),
          },
        }));
    }

    // ─── SAVE CARD SET (with SRS, export ready) ───
    let cardSetId;
    let cardSet;
    let newCards = undefined; // Initialize for existing set additions

    if (existingCardSetId) {
      // Add to existing card set
      cardSetId = new ObjectId(existingCardSetId);
      const existingSet = await db.collection("cardSets").findOne({
        _id: cardSetId,
        userId: userId ? new ObjectId(userId) : null,
      });

      if (!existingSet) {
        return NextResponse.json(
          { error: "Card set not found" },
          { status: 404 }
        );
      }

      // Generate new card IDs starting from the next available ID
      const nextId = (existingCardCount || existingSet.cards.length) + 1;
      newCards = flashcards.cards.map((c, i) => ({
        ...c,
        id: nextId + i,
        _id: new ObjectId(),
        cardSetId,
        reviews: [],
        srs: c.srs || {
          interval: 1,
          repetitions: 0,
          ease: 2.5,
          dueDate: new Date().toISOString(),
        },
      }));

      // Update existing set
      await db.collection("cardSets").updateOne(
        { _id: cardSetId },
        {
          $push: { cards: { $each: newCards } },
          $inc: { totalCards: newCards.length },
          $set: { lastAccessed: new Date() },
        }
      );

      cardSet = {
        ...existingSet,
        cards: [...existingSet.cards, ...newCards],
        totalCards: existingSet.totalCards + newCards.length,
        lastAccessed: new Date(),
      };
    } else {
      // Create new card set
      cardSetId = new ObjectId();

      // Check for ANY existing duplicates for this user/topic/difficulty to prevent waste
      const existingDuplicate = await db.collection("cardSets").findOne({
        userId: userId ? new ObjectId(userId) : null,
        topic: topic.trim().toLowerCase(),
        difficulty,
      });

      if (existingDuplicate) {
        console.log(`Returning existing card set for ${topic} (${difficulty})`);
        return NextResponse.json({
          success: true,
          cardSetId: existingDuplicate._id.toString(),
          title: existingDuplicate.title,
          totalCards: existingDuplicate.totalCards,
          difficulty,
          isPremium,
          canExportToAnki: true,
          canExportToAnki: true,
          monthly: {
            used: usageStatus.used,
            limit: usageStatus.limit,
            resetsOn: usageStatus.resetsOn,
          },
          features: [
            "Spaced Repetition (SM-2)",
            "Review History",
            "Anki Export",
            "Shareable Link",
            "Bookmark & Progress",
            "Auto-reset Monthly Limits",
          ],
          duplicate: true,
          existing: true,
        });
      }

      cardSet = {
        _id: cardSetId,
        userId: userId ? new ObjectId(userId) : null,
        title: flashcards.title || `${topic} - ${difficulty}`,
        topic: topic.trim().toLowerCase(),
        originalTopic: topic,
        difficulty,
        totalCards: flashcards.totalCards || flashcards.cards.length,
        cards: flashcards.cards.map((c, i) => ({
          ...c,
          _id: new ObjectId(),
          cardSetId,
          reviews: [],
          srs: c.srs || {
            interval: 1,
            repetitions: 0,
            ease: 2.5,
            dueDate: new Date().toISOString(),
          },
        })),
        isPremium,
        progress: 0,
        completed: false,
        bookmarked: false,
        ankiExportReady: true,
        createdAt: new Date(),
        lastAccessed: new Date(),
        monthlyGenerationUsed: true,
      };

      // Save async
      await db.collection("cardSets").insertOne(cardSet);
      console.log(`Card set saved: ${cardSetId}`);

      // Increment usage after successful AI generation
      if (userId) {
        await trackAPIUsage(userId, "generate-flashcards");
        usageStatus.used += 1;
      }

      // Enforce per-user card set limits (free: 1, premium: 20) in background or check before?
      // Check before is better, but here we check after insert (if it's just check).
      // The logic seemed to prevent returning success if limit reached, but we just inserted it.
      // Ideally check BEFORE insert.

      if (userId) {
        // Track in user history
        await db.collection("users")
          .updateOne(
            { _id: new ObjectId(userId) },
            {
              $push: {
                generatedCardSets: {
                  setId: cardSetId.toString(),
                  title: cardSet.title,
                  topic,
                  difficulty,
                  generatedAt: new Date(),
                  cardCount,
                },
              },
            }
          );
      }
    }

    return NextResponse.json({
      success: true,
      cardSetId: cardSetId.toString(),
      title: cardSet.title,
      totalCards: cardSet.totalCards,
      difficulty,
      isPremium,
      canExportToAnki: true,
      cards: existingCardSetId ? newCards : undefined, // Return new cards when adding to existing set
      monthly: {
        used: usageStatus.used,
        limit: usageStatus.limit,
        resetsOn: usageStatus.resetsOn,
      },
      features: [
        "Spaced Repetition (SM-2)",
        "Review History",
        "Anki Export",
        "Shareable Link",
        "Bookmark & Progress",
        "Auto-reset Monthly Limits",
      ],
    });
  } catch (error) {
    console.error("Flashcard generation failed:", error);
    return NextResponse.json(
      {
        error: "Failed to generate flashcards",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
