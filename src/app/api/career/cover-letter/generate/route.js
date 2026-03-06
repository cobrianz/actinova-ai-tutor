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
        const { resume, role, company, type } = body;

        if (!role) {
            return NextResponse.json({ error: "Role is required" }, { status: 400 });
        }

        const isApplication = type === 'application-letter';

        if (isApplication && (!role || !company)) {
            return NextResponse.json({ error: "Role and Company are required for an Application Letter" }, { status: 400 });
        }

        const docType = isApplication ? "Application Letter" : "Cover Letter";
        const companyStr = company ? ` at "${company}"` : "";

        const systemPrompt = `You are a professional career coach.
Create a highly persuasive, professional, and tailored ${docType} for the role: "${role}"${companyStr}.
Use the following resume data: ${JSON.stringify(resume)}.
Candidate Name: "${user.firstName || ""} ${user.lastName || ""}".
${user.email ? `Candidate Email: "${user.email}".\n` : ''}

CRITICAL RULES:
1. Make the ${docType} CONCISE and punchy. It must NOT be too long. Aim for 3-4 short paragraphs maximum.
2. Structure it professionally with placeholders for contact info if not provided.
3. Highlight the most relevant skills from the resume for the specific role${company ? ` and emphasize value brought to ${company}` : ''}.
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
