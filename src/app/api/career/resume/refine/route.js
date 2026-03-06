import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { withAPIRateLimit, trackAPIUsage } from "@/lib/planMiddleware";
import CareerHistory from "@/models/CareerHistory";
import dbConnect from "@/lib/dbConnect";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function handlePost(request) {
    const user = request.user;
    const userId = user._id;

    try {
        const body = await request.json();
        const { resume, jobDescription, matchResult } = body;

        if (!resume || !matchResult) {
            return NextResponse.json({ error: "Resume and Match Result are required" }, { status: 400 });
        }

        const systemPrompt = `You are a professional resume writer and ATS optimization expert.
Refine the provided resume to better match the target job description.
Focus on:
1. Integrating the missing keywords: ${JSON.stringify(matchResult.keywordsMissing)}.
2. Addressing these recommendations: ${JSON.stringify(matchResult.recommendations)}.
3. Improving the impact of experience highlights based on the job description: "${jobDescription}".

Maintain the existing structure but improve the content wordings for better ATS scores and recruiter impact.

Original Resume: ${JSON.stringify(resume)}.

Provide the output in a structured JSON format matching this structure:
{
  "personalInfo": { "name": "...", "email": "...", "title": "..." },
  "summary": "...",
  "experience": [{ "company": "...", "position": "...", "duration": "...", "highlights": ["..."] }],
  "education": [{ "school": "...", "degree": "...", "year": "..." }],
  "skills": ["...", "..."],
  "projects": [{ "name": "...", "description": "...", "technologies": "..." }]
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [{ role: "system", content: systemPrompt }]
        });

        const data = JSON.parse(completion.choices[0].message.content);

        await trackAPIUsage(userId, "career-resume-refine");

        return NextResponse.json(data);
    } catch (error) {
        console.error("Resume refinement error:", error);
        return NextResponse.json({ error: "Failed to refine resume" }, { status: 500 });
    }
}

export const POST = combineMiddleware(
    withErrorHandling,
    withCsrf,
    withAuth,
    (h) => withAPIRateLimit(h, "career")
)(handlePost);

export const dynamic = "force-dynamic";
