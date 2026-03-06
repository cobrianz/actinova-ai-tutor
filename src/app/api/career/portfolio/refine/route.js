import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { withAPIRateLimit } from "@/lib/planMiddleware";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function handlePost(request) {
    const user = request.user;
    const body = await request.json();
    const { projectTitle, description, role } = body;

    if (!projectTitle) {
        return NextResponse.json({ error: "Project title is required" }, { status: 400 });
    }

    const prompt = `You are a senior software engineer and technical project manager.
The user wants to build the following portfolio project using an AI coding assistant (like Cursor, GitHub Copilot, or ChatGPT).
Write a comprehensive, step-by-step developer prompt that the user can copy and paste into their AI to generate the full project.

Project Title: "${projectTitle}"
Brief Idea: "${description || "No description provided"}"
Target Role: "${role || "Software Developer"}"

Provide a detailed AI prompt that includes:
- The core objective of the application
- Recommended modern tech stack appropriate for a ${role}
- Key features and requirements to prioritize
- File structure or architectural suggestions
- Any specific edge cases or UI/UX requirements to consider

Return ONLY the AI prompt text so the user can copy it directly.`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7,
            messages: [{ role: "user", content: prompt }]
        });

        const content = completion.choices[0].message.content?.trim() || description || "";
        return NextResponse.json({ content });
    } catch (error) {
        console.error("Portfolio refine error:", error);
        return NextResponse.json({ error: "Failed to refine project" }, { status: 500 });
    }
}

export const POST = combineMiddleware(
    withErrorHandling,
    withCsrf,
    withAuth,
    (h) => withAPIRateLimit(h, "career")
)(handlePost);

export const dynamic = "force-dynamic";
