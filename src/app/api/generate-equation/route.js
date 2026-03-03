// src/app/api/generate-equation/route.js
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
        const { prompt } = body;

        if (!prompt?.trim()) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const systemPrompt = `You are a mathematical typesetting expert.
Convert a natural language description of a math equation or formula into a beautiful, semantically correct HTML fragment.

STRICT RULES:
- Return ONLY a self-contained HTML string, no markdown, no backticks
- Use <div>, <span>, <sup>, <sub>, <span style="..."> for layout
- For fractions, use: <span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 4px;"><span style="border-bottom:1.5px solid currentColor;padding:0 4px;text-align:center;">numerator</span><span style="padding:0 4px;text-align:center;">denominator</span></span>
- For square roots: use √ unicode with overline via CSS border-top trick or just use &#x221A;
- Use italic for variables: <i>x</i>, <i>y</i>, etc.
- Wrap main expression in: <div style="font-family:'Times New Roman',serif;font-size:1.8rem;text-align:center;padding:8px 16px;line-height:2;">...</div>
- Include the equation label/name as a small gray caption below: <div style="font-size:0.85rem;color:#9ca3af;text-align:center;margin-top:4px;">equation name</div>
- Keep it readable and clean. No MathML. No LaTeX. Pure HTML only.`;

        const userPrompt = `Generate HTML for this math equation: "${prompt}"`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.2,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        });

        let html = completion.choices[0].message.content.trim();
        html = html.replace(/^```html\n?/i, '').replace(/^```\n?/, '').replace(/\n?```$/, '');

        return NextResponse.json({ html });
    } catch (error) {
        console.error("Equation generation error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate equation" }, { status: 500 });
    }
}

export const POST = withErrorHandling(withAuth(handlePost));
export const runtime = "nodejs";
