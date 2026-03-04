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
        const { role, difficulty } = body;

        if (!role?.trim()) {
            return NextResponse.json({ error: "Role is required" }, { status: 400 });
        }

        const systemPrompt = `You are an expert technical and behavioral recruiter.
Generate exactly 5 interview questions for a candidate applying for the role of "${role}".
The questions should match the difficulty level: "${difficulty || 'intermediate'}".
Provide the output in JSON format with an array of strings.

JSON Structure:
{
  "questions": [
    "Question 1",
    "Question 2",
    "Question 3",
    "Question 4",
    "Question 5"
  ]
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Generate 5 structured interview questions for ${role} at ${difficulty} level.` }
            ]
        });

        const data = JSON.parse(completion.choices[0].message.content);

        await trackAPIUsage(userId, "career-interview");

        return NextResponse.json(data);
    } catch (error) {
        console.error("Interview questions generation error:", error);
        return NextResponse.json({ error: "Failed to generate interview questions" }, { status: 500 });
    }
}

export const POST = combineMiddleware(
    withErrorHandling,
    withCsrf,
    withAuth,
    (h) => withAPIRateLimit(h, "career")
)(handlePost);

export const dynamic = "force-dynamic";
