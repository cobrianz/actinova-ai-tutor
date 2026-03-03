// src/app/api/generate-report-outline/route.js

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function handlePost(request) {
    const user = request.user;
    const userId = user._id;

    try {
        const { topic, type, length, difficulty, citationStyle, academicLevel, criticalDepth } = await request.json();

        if (!topic?.trim()) {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }

        const { getUserPlanLimits, canAccessDifficulty } = await import("@/lib/planLimits");

        if (difficulty && !canAccessDifficulty(user, difficulty)) {
            return NextResponse.json(
                { error: `Your current plan does not support ${difficulty} level reports. Please upgrade to Pro.` },
                { status: 403 }
            );
        }

        const systemPrompt = `🎯 ROLE
You are an academic writing engine specialized in producing high-quality, structured content for Actinova AI Tutor.

📐 TASK
Generate a comprehensive outline for a ${type} on the topic: "${topic}".

Rules:
- Academic Level: ${academicLevel || "Undergraduate"}.
- Critical Depth: ${criticalDepth || "Moderate"}.
- Formatting / Citation Style: ${citationStyle || "APA 7"}.
- Tone: Formal, objective academic tone. Use disciplinary terminology correctly.
- Coherence: Ensure logical flow between sections.
- Structural Rules:
    - **No markdown**.
    - **No bullet symbols**.
    - **No numbering** in headings.
    - If the topic contains specific assignment questions or exam prompts, structure the outline to answer EACH question sequentially and thoroughly, producing a top-tier A-grade academic paper.
    - Include an "Abstract" section at the start.
    - Include "Introduction" and "Conclusion" sections.
    - For each section, provide a short heading and a detailed description of the sub-topics to be covered.
    - Include a "Cover" section at the start.
    - Specify the target word count per section to meet the overall length: ${length}.

🔒 OUTPUT FORMAT: JSON only.
{
  "title": "Main Title",
  "abstract": "Brief overview (approx 150-250 words)",
  "outline": [
    {
      "id": "01",
      "title": "Section Title",
      "heading": "Professional Academic Heading",
      "description": "Detailed sub-topics and arguments to be covered...",
      "isCover": true/false,
      "targetWords": 300
    },
    ...
  ]
}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [{ role: "system", content: systemPrompt }],
        });

        const outlineData = JSON.parse(completion.choices[0].message.content);

        const { db } = await connectToDatabase();

        const newReport = {
            userId: new ObjectId(userId),
            title: outlineData.title,
            topic,
            type,
            length,
            difficulty,
            citationStyle: citationStyle || "APA",
            outline: outlineData.outline,
            abstract: outlineData.abstract || "",
            sections: {}, // Will store generated content for each section
            fullContent: "",
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection("reports").insertOne(newReport);

        // Track API Usage for Reports
        const { trackAPIUsage } = await import("@/lib/planMiddleware");
        await trackAPIUsage(user._id, "generate-report-outline");

        return NextResponse.json({
            success: true,
            reportId: result.insertedId.toString(),
            outline: outlineData.outline
        });

    } catch (error) {
        console.error("Outline generation error:", error);
        return NextResponse.json({ error: "Failed to generate outline" }, { status: 500 });
    }
}

export const POST = combineMiddleware(
    withErrorHandling,
    withAuth,
    (handler) => {
        const { withAPIRateLimit } = require("@/lib/planMiddleware");
        return withAPIRateLimit(handler, "generate-report-outline");
    }
)(handlePost);
