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
        const { resume, role } = body;

        const systemPrompt = `You are a professional portfolio designer.
Based on the following resume and target role "${role}", suggest 5 unique and high-impact portfolio project ideas that would WOW a recruiter.

Return ONLY a valid JSON object in this exact format:
{
  "prompts": [
    {
      "title": "Project Name",
      "description": "2-3 sentence compelling description of the project and its impact",
      "difficulty": "intermediate",
      "technologies": ["Tech1", "Tech2", "Tech3"]
    }
  ]
}

Resume Data: ${JSON.stringify(resume)}.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [{ role: "system", content: systemPrompt }]
        });

        const data = JSON.parse(completion.choices[0].message.content);

        await trackAPIUsage(userId, "career-portfolio-gen", { itemType: "career_tools", creditCost: 25 });

        return NextResponse.json(data);
    } catch (error) {
        console.error("Portfolio prompt generation error:", error);
        return NextResponse.json({ error: "Failed to generate portfolio prompts" }, { status: 500 });
    }
}

export const POST = combineMiddleware(
    withErrorHandling,
    withCsrf,
    withAuth,
    (h) => withAPIRateLimit(h, "career")
)(handlePost);

export const dynamic = "force-dynamic";
