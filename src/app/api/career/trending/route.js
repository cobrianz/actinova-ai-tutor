import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withErrorHandling, combineMiddleware, withAuth } from "@/lib/middleware";
import { withAPIRateLimit, trackAPIUsage } from "@/lib/planMiddleware";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function handleGet(request) {
    const currentYear = new Date().getFullYear();
    const user = request.user || null;
    const userId = user?._id || "anonymous";

    console.log(`[Trending API] Request received for year ${currentYear}, user: ${userId}`);

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
        console.error("[Trending API] OPENAI_API_KEY is not configured");
        return NextResponse.json({
            trendingCareers: [],
            trendingSkills: [],
            marketInsights: "AI service is not configured. Please contact support.",
            error: "OPENAI_API_KEY_MISSING"
        }, { status: 200 });
    }

    try {
        console.log("[Trending API] Calling OpenAI...");
        const systemPrompt = `You are an expert career analyst and market researcher specializing in job market trends and emerging skills.
Analyze the current job market and provide trending careers and skills for ${currentYear}.
Provide a comprehensive analysis in JSON format.

JSON Structure:
{
  "trendingCareers": [
    {
      "title": "Career title",
      "growth": "percentage growth (e.g., '25%')",
      "description": "Why this career is trending",
      "averageSalary": "Salary range (e.g., '$80k-$120k')",
      "skills": ["skill1", "skill2", "skill3"],
      "industry": "Industry sector"
    }
  ],
  "trendingSkills": [
    {
      "skill": "Skill name",
      "demand": "high"|"medium"|"critical",
      "description": "Why this skill is important",
      "relatedCareers": ["career1", "career2"],
      "learningResources": "Suggested learning approach"
    }
  ],
  "marketInsights": "Overall market trends and predictions for ${currentYear}",
  "emergingFields": ["Field 1", "Field 2", "Field 3"]
}

Focus on:
- AI/ML related careers and skills
- Remote work enabling skills
- Sustainability and green tech
- Healthcare technology
- Cybersecurity
- Data science and analytics
- Cloud computing
- Digital marketing
- Software development trends

Be specific and data-driven. Use current market data and trends.`;

        const userPrompt = `Provide trending careers and skills for ${currentYear}. Include both technical and soft skills that are in high demand.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            max_tokens: 2000
        });

        let trends;
        try {
            const content = completion.choices[0].message.content;
            console.log("[Trending API] Received AI response, parsing JSON...");
            trends = JSON.parse(content);

            // Validate and ensure required fields exist
            if (!trends.trendingCareers) trends.trendingCareers = [];
            if (!trends.trendingSkills) trends.trendingSkills = [];
            if (!trends.marketInsights) trends.marketInsights = "Market analysis unavailable at this time.";

            console.log(`[Trending API] Success! Found ${trends.trendingCareers.length} careers and ${trends.trendingSkills.length} skills`);
        } catch (parseError) {
            console.error("[Trending API] Failed to parse AI response:", parseError);
            console.error("[Trending API] Response content:", completion.choices[0]?.message?.content?.substring(0, 200));
            // Return a fallback response
            trends = {
                trendingCareers: [],
                trendingSkills: [],
                marketInsights: "Unable to generate market insights at this time. Please try again later."
            };
        }

        // Track usage if user is authenticated
        if (userId !== "anonymous") {
            try {
                await trackAPIUsage(userId, "career-trending");
            } catch (e) {
                // Ignore tracking errors
            }
        }

        console.log("[Trending API] Returning successful response");
        return NextResponse.json(trends);
    } catch (error) {
        console.error("[Trending API] Error occurred:", error);
        console.error("[Trending API] Error details:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        // Return a fallback response instead of error
        return NextResponse.json({
            trendingCareers: [],
            trendingSkills: [],
            marketInsights: "Unable to load trending data at this time. Please try again later.",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        }, { status: 200 }); // Return 200 with empty data instead of error
    }
}

export const GET = combineMiddleware(
    withErrorHandling,
    (handler) => withAuth(handler, { optional: true }),
    (h) => withAPIRateLimit(h, "career")
)(handleGet);

export const dynamic = "force-dynamic";

