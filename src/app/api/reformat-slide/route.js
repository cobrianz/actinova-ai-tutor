// src/app/api/reformat-slide/route.js
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling } from "@/lib/middleware";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1"
});

async function handlePost(request) {
    try {
        const body = await request.json();
        const { originalHtml, targetLayoutHtml, layoutName } = body;

        if (!originalHtml || !targetLayoutHtml) {
            return NextResponse.json({ error: "originalHtml and targetLayoutHtml are required" }, { status: 400 });
        }

        const systemPrompt = `You are an expert HTML presentation editor.
Your task: take the TEXT CONTENT from the source slide HTML and intelligently reflow it into a new target layout HTML template.

RULES:
- Extract all meaningful text (headings, body text, bullet points, captions) from the source HTML
- Place text logically into the contenteditable elements of the target template
- Keep the structural HTML of the target layout EXACTLY as-is
- Only modify text inside contenteditable elements
- Do NOT change any class names, style attributes, or structural divs in the target
- Distribute content proportionally - put titles in title areas, body in body areas
- If source has less content than target slots, keep some placeholder text from target
- If source has more content, summarize or truncate gracefully
- Return ONLY the final complete HTML string, nothing else, no markdown, no backticks`;

        const userPrompt = `SOURCE SLIDE HTML (extract content from here):
${originalHtml}

TARGET LAYOUT TEMPLATE (reflow content into this, keep structure intact, only change text in contenteditable elements):
${targetLayoutHtml}

Layout name: ${layoutName}

Return only the final HTML string.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.3,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        });

        let resultHtml = completion.choices[0].message.content.trim();
        // Strip markdown code blocks if AI accidentally wraps
        resultHtml = resultHtml.replace(/^```html\n?/i, '').replace(/^```\n?/, '').replace(/\n?```$/, '');

        return NextResponse.json({ html: resultHtml });
    } catch (error) {
        console.error("Slide reformat error:", error);
        return NextResponse.json({ error: error.message || "Failed to reformat slide" }, { status: 500 });
    }
}

export const POST = withErrorHandling(withAuth(handlePost));
export const runtime = "nodejs";
