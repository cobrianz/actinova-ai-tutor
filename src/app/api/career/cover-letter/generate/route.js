import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { withAPIRateLimit, trackAPIUsage } from "@/lib/planMiddleware";
import dbConnect from "@/lib/dbConnect";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function handlePost(request) {
    const user = request.user;
    const userId = user._id;

    try {
        const body = await request.json();
        const { resume, role } = body;

        if (!role) {
            return NextResponse.json({ error: "Role is required" }, { status: 400 });
        }

        const systemPrompt = `You are a professional career coach.
Create a highly persuasive, professional, and tailored cover letter for the role: "${role}".
Use the following resume data: ${JSON.stringify(resume)}.
Candidate Name: "${user.firstName} ${user.lastName}".

The letter should be structured professionally with placeholders for contact info if not provided.
Ensure it highlights the most relevant skills from the resume for the specific role.
Return the output in a JSON format: { "content": "..." }`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [{ role: "system", content: systemPrompt }]
        });

        const data = JSON.parse(completion.choices[0].message.content);

        await trackAPIUsage(userId, "career-cl-gen");

        return NextResponse.json(data);
    } catch (error) {
        console.error("Cover letter generation error:", error);
        return NextResponse.json({ error: "Failed to generate cover letter" }, { status: 500 });
    }
}

export const POST = combineMiddleware(
    withErrorHandling,
    withCsrf,
    withAuth,
    (h) => withAPIRateLimit(h, "career")
)(handlePost);

export const dynamic = "force-dynamic";
