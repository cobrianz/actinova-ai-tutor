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
        const { role, question, answer, difficulty } = body;

        if (!role?.trim() || !question?.trim() || !answer?.trim()) {
            return NextResponse.json({ error: "Role, question, and answer are required" }, { status: 400 });
        }

        const systemPrompt = `You are an expert interviewer for ${role} positions.
Analyze the candidate's answer to the specific question provided.
Provide a detailed evaluation in JSON format.

JSON Structure:
{
  "score": number (0-100),
  "feedback": "Concise summary of performance",
  "technicalAccuracy": "Evaluation of technical correctness (if applicable)",
  "communicationStyle": "Evaluation of clarity, tone, and confidence",
  "strengths": ["string"],
  "improvedAnswer": "A high-quality version of how the candidate should have answered",
  "followUpQuestions": ["string"]
}

Be realistic. Adjust your expectations based on the difficulty level (${difficulty || 'intermediate'}).`;

        const userPrompt = `Question: ${question}
Candidate Answer: ${answer}`;

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

        await dbConnect();
        const history = new CareerHistory({
            userId,
            type: "interview",
            title: role,
            data: feedback,
            metadata: { question, difficulty }
        });
        await history.save();

        await trackAPIUsage(userId, "career-interview");

        return NextResponse.json(feedback);
    } catch (error) {
        console.error("Interview feedback error:", error);
        return NextResponse.json({ error: "Failed to evaluate interview answer" }, { status: 500 });
    }
}

export const POST = combineMiddleware(
    withErrorHandling,
    withCsrf,
    withAuth,
    (h) => withAPIRateLimit(h, "career")
)(handlePost);

export const dynamic = "force-dynamic";
