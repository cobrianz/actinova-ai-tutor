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
        const { currentSkills, targetRole, careerGoals } = body;

        if (!targetRole?.trim() || !currentSkills?.trim()) {
            return NextResponse.json({ error: "Target role and current skills are required" }, { status: 400 });
        }

        const systemPrompt = `You are an expert career strategist and technical recruiter.
Perform a comprehensive Skill Gap Analysis between the user's current skills and the requirements for the target role.
Provide a detailed report in JSON format.

JSON Structure:
{
  "matchPercentage": number (0-100),
  "analysis": "High-level summary of skill alignment",
  "topGaps": [
    {
      "skill": "name of missing/weak skill",
      "priority": "critical"|"high"|"medium",
      "description": "why this skill is important for the role"
    }
  ],
  "foundationalSkills": ["skills the user already has that are relevant"],
  "learningPath": [
    {
      "step": "Title of step",
      "topic": "Specific subject to study",
      "rationale": "How this helps bridge the gap"
    }
  ],
  "marketInsights": "Current trends or hiring landscape for this role"
}

Be precise. Focus on technical skills, soft skills, and specific industry tools.`;

        const userPrompt = `Target Role: ${targetRole}
Current Skills/Experience: ${currentSkills}
Career Goals: ${careerGoals || "Advancement in field"}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        });

        const analysis = JSON.parse(completion.choices[0].message.content);

        await trackAPIUsage(userId, "career-skill-gap");

        return NextResponse.json(analysis);
    } catch (error) {
        console.error("Skill Gap Analysis error:", error);
        return NextResponse.json({ error: "Failed to perform skill gap analysis" }, { status: 500 });
    }
}

export const POST = combineMiddleware(
    withErrorHandling,
    withCsrf,
    withAuth,
    (h) => withAPIRateLimit(h, "career")
)(handlePost);

export const dynamic = "force-dynamic";
