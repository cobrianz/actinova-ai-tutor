// src/app/api/generate-report-section/route.js

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling } from "@/lib/middleware";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function handlePost(request) {
    const user = request.user;
    const userId = user._id;

    try {
        const {
            reportId,
            sectionId,
            sectionTitle,
            sectionDescription,
            topic,
            type,
            difficulty,
            citationStyle,
            requestedPages,
            existingContent
        } = await request.json();

        if (!reportId || !sectionId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const systemPrompt = `🎯 ROLE
You are an expert academic and professional writer. Your task is to write a specific section for a ${type} on the topic: "${topic}".

📐 SECTION DETAILS
- Title: ${sectionTitle}
- Description: ${sectionDescription}
- Difficulty: ${difficulty}
- Citation Style: ${citationStyle || "APA"}
- Requested Length: Approximately ${requestedPages || 1} page(s) worth of content.

📜 RULES
- Write the content directly in HTML format suitable for a Word-like editor (using <p>, <h3>, <ul>, <li>, <strong>, etc.).
- The content should be professional, insightful, and flow logically.
- Strictly adhere to ${citationStyle || "APA"} formatting and citation conventions if applicable.
- Aim to provide enough depth for the requested ${requestedPages || 1} page(s).
- Avoid repeating content that might be in the "Introduction" or other general sections unless necessary.
- If this is a "Cover" section, generate a beautiful centered layout with a large title and subtitle.
- Output ONLY the HTML content. No markdown code blocks, no explanation.

${existingContent ? `CONTEXT: The following content already exists in the report. Ensure consistency and avoid redundancy:\n${existingContent.substring(0, 1000)}...` : ""}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.7,
            messages: [{ role: "system", content: systemPrompt }],
        });

        const htmlContent = completion.choices[0].message.content;

        // We don't save to DB here; the editor will handle saving the combined state
        return NextResponse.json({
            success: true,
            html: htmlContent
        });

    } catch (error) {
        console.error("Section generation error:", error);
        return NextResponse.json({ error: "Failed to generate section" }, { status: 500 });
    }
}

export const POST = withErrorHandling(withAuth(handlePost));
