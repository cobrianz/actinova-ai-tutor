import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { withAPIRateLimit, trackAPIUsage } from "@/lib/planMiddleware";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function handlePost(request) {
    const user = request.user;
    const userId = user._id;
    try {
        const body = await request.json();
        const { text, instruction, context } = body;

        if (!text || !instruction) {
            return NextResponse.json({ error: "Text and instruction are required" }, { status: 400 });
        }

        const systemPrompt = `You are a professional resume writer and editor.
Your task is to improve the following text based on the instruction given.
${context?.role ? `Target Job Role: "${context.role}"` : ""}

Instruction: "${instruction}"
Original Text: "${text}"

Return ONLY a valid JSON object: { "content": "improved text here" }
Keep the improved text concise, professional and impactful. Do not add filler phrases.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.6,
            response_format: { type: "json_object" },
            messages: [{ role: "system", content: systemPrompt }]
        });

        const data = JSON.parse(completion.choices[0].message.content);
        await trackAPIUsage(userId, "career-ai-edit");
        return NextResponse.json(data);
    } catch (error) {
        console.error("AI edit error:", error);
        return NextResponse.json({ error: "Failed to refine text" }, { status: 500 });
    }
}

export const POST = combineMiddleware(
    withErrorHandling,
    withCsrf,
    withAuth,
    (h) => withAPIRateLimit(h, "career")
)(handlePost);

export const dynamic = "force-dynamic";
