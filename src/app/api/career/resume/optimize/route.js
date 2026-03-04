import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { withAPIRateLimit, trackAPIUsage } from "@/lib/planMiddleware";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function handlePost(request) {
    const user = request.user;
    const userId = user._id;

    try {
        const body = await request.json();
        const { resumeText, jobDescription } = body;

        if (!resumeText?.trim()) {
            return NextResponse.json({ error: "Resume text is required" }, { status: 400 });
        }

        const systemPrompt = `You are an expert career coach and ATS (Applicant Tracking System) specialist.
Analyze the provided resume against the job description (if provided).
Provide a detailed optimization report in JSON format.

JSON Structure:
{
  "score": number (0-100),
  "summary": "High-level overview of resume strength",
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "optimizations": [
    {
      "section": "e.g., Skills, Experience",
      "current": "current text snippet or description",
      "suggestion": "specific improved wording or action",
      "impact": "why this helps"
    }
  ],
  "atsKeywords": {
    "found": ["string"],
    "missing": ["string"]
  },
  "actionItems": ["highly specific steps to take"]
}

Be critical but constructive. Focus on impact, quantifiable results, and keyword alignment.`;

        const userPrompt = `Resume:
${resumeText}

Job Description:
${jobDescription || "N/A"}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        });

        const feedback = JSON.parse(completion.choices[0].message.content);

        // Track usage (using generate-doc as a proxy or specific career limit if defined)
        await trackAPIUsage(userId, "career-optimization");

        return NextResponse.json(feedback);
    } catch (error) {
        console.error("Resume optimization error:", error);
        return NextResponse.json({ error: "Failed to optimize resume" }, { status: 500 });
    }
}

export const POST = combineMiddleware(
    withErrorHandling,
    withCsrf,
    withAuth,
    (h) => withAPIRateLimit(h, "career")
)(handlePost);

export const dynamic = "force-dynamic";
