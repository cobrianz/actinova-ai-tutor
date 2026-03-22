// src/app/api/explore/trending/route.js

import { NextResponse } from "next/server";
import OpenAI from "openai";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CURRENT_YEAR = new Date().getFullYear();

// Cache expires every Sunday at midnight (Saturday Transition)
function getLatestSundayMidnight() {
  const now = new Date();
  const day = now.getDay(); // 0 (Sun) to 6 (Sat)
  const lastSunday = new Date(now);
  lastSunday.setDate(now.getDate() - day);
  lastSunday.setHours(0, 0, 0, 0);
  return lastSunday;
}

export async function generateExploreTrending() {
  const { db } = await connectToDatabase();
  const userId = "global_trending";

  try {
    // Shared trending - no personalization context needed to save API and ensures consistency
    const personalization = `\n\nEnsure a balanced mix of 12 courses across multiple fields: Tech, Business, Health, Arts, Science, and Lifestyle. At least 2 courses from each major pillar.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are the world's best learning experience curator in ${CURRENT_YEAR}.

Generate EXACTLY 12 irresistible, currently trending online course topics that learners are obsessed with right now.

IMPORTANT: Cover DIVERSE fields beyond just technology. Include:
- Technology (AI, Programming, Web Development, etc.)
- Business & Entrepreneurship (Marketing, Finance, Management, etc.)
- Health & Wellness (Fitness, Nutrition, Mental Health, Medicine, etc.)
- Creative Arts (Design, Music, Writing, Photography, Art, etc.)
- Humanities (History, Philosophy, Languages, Literature, etc.)
- Science (Physics, Chemistry, Biology, Astronomy, etc.)
- Lifestyle (Cooking, Gardening, Crafts, Personal Development, etc.)
- Professional Skills (Leadership, Communication, Project Management, etc.)
- Trades & Technical Skills (Carpentry, Plumbing, Electrical, etc.)
- Education & Teaching (Pedagogy, Curriculum Design, etc.)

Ensure variety - NOT all tech courses. Mix different fields based on what's trending globally.

Each topic must include:
- A magnetic title (short & punchy)
- A description that makes you want to enroll instantly
- One clear category
- Realistic difficulty + duration
- 4 perfect tags
- A "whyTrending" that feels urgent and real
- 3-4 real learner questions with helpful answers
- A "hook" field: one bold promise (e.g. "Go from zero to hired in 10 weeks")

Return ONLY a clean JSON array. No markdown. No extra text.

Make them feel fresh, actionable, and impossible to ignore.${personalization}`,
        },
        {
          role: "user",
          content: `Give me exactly 12 of the hottest, most in-demand online course topics for ${CURRENT_YEAR} — right now, today. Make them diverse, exciting, and perfectly relevant to real learners. Return ONLY a JSON array with exactly 12 objects.`,
        },
      ],
      temperature: 0.9,
      max_tokens: 4500,
    });

    let topics = [];

    try {
      const raw = completion.choices[0].message.content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(raw);
      topics = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("AI JSON parse failed:", e);
    }

    // === 4. Validation ===
    if (topics.length < 6) {
      throw new Error("AI failed to generate sufficient trending topics");
    }
    if (topics.length < 12) {
      console.warn(`[trending-topics] AI returned only ${topics.length} topics (expected 12). Caching partial result.`);
    }

    const finalTopics = topics.slice(0, 12);

    // === 5. Cache Results (Shared global cache) ===
    await db.collection("explore_trending").deleteMany({ userId: "global_trending" });
    await db.collection("explore_trending").insertOne({
      userId: "global_trending",
      topics: finalTopics,
      createdAt: new Date(),
      generatedForUser: "global",
      model: "gpt-4o-mini",
    });

    return {
      success: true,
      topics: finalTopics,
      source: "ai-generated",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Explore Trending generation error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate trending topics",
      topics: [],
      source: "error",
      refreshedAt: new Date().toISOString(),
    };
  }
}



export async function GET(request) {
  const { db } = await connectToDatabase();

  try {
    // === 1. Check Shared Cache (refreshes every Sunday midnight) ===
    const lastSunday = getLatestSundayMidnight();
    const userId = "global_trending";

    const cached = await db.collection("explore_trending").findOne({
      userId,
      createdAt: { $gte: lastSunday },
    });

    if (cached?.topics?.length >= 12) {
      return NextResponse.json({
        success: true,
        topics: cached.topics.slice(0, 12),
        source: "cache",
        refreshedAt: cached.createdAt,
      });
    }

    const result = await generateExploreTrending();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Trending topics critical failure:", error);

    // Nuclear fallback — always works
    return NextResponse.json({
      success: true,
      topics: getFallbackTopics(),
    });
  }
}
