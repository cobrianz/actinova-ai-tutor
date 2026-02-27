// src/app/api/generate-report-outline/route.js

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
        const { topic, type, length, difficulty, citationStyle } = await request.json();

        if (!topic?.trim()) {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }

        const systemPrompt = `🎯 ROLE
You are an expert academic and professional writer. Your task is to generate a comprehensive outline for a ${type} on the topic: "${topic}".

📐 STRUCTURAL RULES
- The outline should be structured as a sequence of logical sections.
- Target difficulty level: ${difficulty}.
- Length requirement: ${length}.
- Formatting / Citation Style: ${citationStyle || "APA"}.
- For each section, provide a title and a brief description of what should be covered.
- Include a "Cover" section at the start with a title and subtitle.
- Output strictly in JSON format.

🔒 OUTPUT FORMAT: JSON only.
{
  "title": "Main Title",
  "outline": [
    {
      "id": "01",
      "title": "Section Title",
      "description": "What this section covers...",
      "isCover": true/false
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
            sections: {}, // Will store generated content for each section
            fullContent: "",
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection("reports").insertOne(newReport);

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

export const POST = withErrorHandling(withAuth(handlePost));
