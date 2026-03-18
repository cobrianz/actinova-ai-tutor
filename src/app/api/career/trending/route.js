import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withErrorHandling, combineMiddleware, withAuth } from "@/lib/middleware";
import { withAPIRateLimit, trackAPIUsage } from "@/lib/planMiddleware";
import TrendingCareer from "@/models/TrendingCareer";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateCareerTrending(user = null) {
    const currentYear = new Date().getFullYear();
    const userId = user?._id || "global";

    // Build personalized prompt if user data exists
    let personalizationContext = "";
    if (user) {
        const interests = user.interests?.join(", ") || "various technology sectors";
        const goals = user.goals?.join(", ") || "career advancement";
        const skillLevel = user.skillLevel || "intermediate";

        // Get recently generated courses for better context
        let recentCourses = [];
        try {
            const { db } = await import("@/lib/mongodb").then(m => m.connectToDatabase());
            const courses = await db.collection("library")
                .find({ userId, format: "course" })
                .sort({ createdAt: -1 })
                .limit(5)
                .project({ title: 1 })
                .toArray();
            recentCourses = courses.map(c => c.title);
        } catch (e) {
            console.warn("[Trending API] Failed to fetch recent courses:", e.message);
        }

        personalizationContext = `\n\nUSER PROFILE CONTEXT:
- Interests: ${interests}
- Career Goals: ${goals}
- Current Skill Level: ${skillLevel}
${recentCourses.length > 0 ? `- Recently Generated/Interested Courses: ${recentCourses.join(", ")}` : ""}
Please prioritize careers and skills that align with these interests, goals, and recent activity while maintaining general market relevance.`;
    }

    const systemPrompt = `You are an expert career analyst.
Analyze the current job market and provide trending careers and skills for ${currentYear}.
Provide a comprehensive analysis in JSON format.${personalizationContext}

JSON Structure:
{
  "trendingCareers": [
    {
      "title": "Career title",
      "growth": "percentage growth",
      "description": "Why it's trending",
      "averageSalary": "Salary range",
      "skills": ["skill1", "skill2"],
      "industry": "Industry sector"
    }
  ],
  "trendingSkills": [
    {
      "skill": "Skill name",
      "demand": "high"|"medium"|"critical",
      "description": "Importance",
      "relatedCareers": ["career1"],
      "learningResources": "Resources"
    }
  ],
  "marketInsights": "Market trends",
  "emergingFields": ["Field 1"]
}`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: systemPrompt }]
    });

    const trends = JSON.parse(completion.choices[0].message.content);

    // Persist
    try {
        // Delete any old/expired record
        await TrendingCareer.deleteOne({ userId });

        const newRecord = await TrendingCareer.create({
            userId,
            ...trends,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        if (userId !== "global") {
            await trackAPIUsage(userId, "career-trending");
        }
        return newRecord;
    } catch (saveError) {
        console.error("[Trending API] Save error:", saveError);
        return trends;
    }
}

async function handleGet(request) {
    const user = request.user || null;
    const userId = user?._id;

    console.log(`[Trending API] Request received for user: ${userId || "anonymous"}`);

    // If authenticated, check for existing non-expired data
    if (userId) {
        try {
            const existing = await TrendingCareer.findOne({ userId });
            if (existing && existing.expiresAt > new Date()) {
                console.log("[Trending API] Returning cached persistent data");
                return NextResponse.json(existing);
            }
        } catch (dbError) {
            console.error("[Trending API] DB check error:", dbError);
        }
    } else {
        // check global cache
        const globalCache = await TrendingCareer.findOne({ userId: "global" });
        if (globalCache && globalCache.expiresAt > new Date()) {
            return NextResponse.json(globalCache);
        }
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({
            trendingCareers: [],
            trendingSkills: [],
            marketInsights: "AI service is not configured.",
            error: "OPENAI_API_KEY_MISSING"
        }, { status: 200 });
    }

    try {
        const trends = await generateCareerTrending(user);
        return NextResponse.json(trends);
    } catch (error) {
        console.error("[Trending API] Error occurred:", error);
        return NextResponse.json({
            trendingCareers: [],
            trendingSkills: [],
            marketInsights: "Unable to load trending data."
        }, { status: 200 });
    }
}

export const GET = combineMiddleware(
    withErrorHandling,
    (handler) => withAuth(handler, { optional: true }),
    (h) => withAPIRateLimit(h, "career")
)(handleGet);

export const dynamic = "force-dynamic";

