import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function handlePost(request) {
    try {
        const { text, action, topic, citationStyle } = await request.json();

        if (!text || !action) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let instruction = "";
        switch (action) {
            case "regenerate":
                instruction = "Rewrite the following text completely while maintaining the core message and meaning. Use a formal academic tone.";
                break;
            case "reparaphrase":
                instruction = "Paraphrase the following text into a different sentence structure and wording. Keep the formal academic tone.";
                break;
            case "expand":
                instruction = "Expand upon the following text by adding more detail, explanations, and depth. Maintain a formal academic tone.";
                break;
            case "shorten":
                instruction = "Shorten the following text while keeping only the most essential information. Maintain a formal academic tone.";
                break;
            default:
                instruction = "Rewrite the text in a formal academic tone.";
        }

        const systemPrompt = `🎯 ROLE
You are an expert academic writing assistant. Your task is to: ${instruction}

📐 CONTEXT
- Topic: ${topic || "Academic Research"}
- Citation Style: ${citationStyle || "APA 7"}

📜 RULES
- Writing Tone: Formal academic tone.
- Formatting: No markdown. No outside commentary. Return only the revised text.
- **Citations**: STRICTLY PRESERVE any in-text citations (e.g. (Smith, 2023) or [1]). If you reorganize the text, ensure the citations are still attached to the correct claims. Accuracy of citations is priority #1.
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.7,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
        });

        const rewrittenText = completion.choices[0].message.content.trim();

        return NextResponse.json({
            success: true,
            data: rewrittenText
        });

    } catch (error) {
        console.error("Rewrite content error:", error);
        return NextResponse.json({ error: "Failed to rewrite content" }, { status: 500 });
    }
}

export const POST = combineMiddleware(
    withErrorHandling,
    withAuth,
    (handler) => {
        const { withAPIRateLimit } = require("@/lib/planMiddleware");
        return withAPIRateLimit(handler, "generate-report-section"); // Linking to same quota limit
    }
)(handlePost);
