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
        const { resume, jobDescription } = body;

        if (!jobDescription?.trim()) {
            return NextResponse.json({ error: "Job description is required" }, { status: 400 });
        }

        const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyst and career coach.
Analyze the resume against the following job description and provide a detailed match analysis.

Job Description:
"${jobDescription}"

Resume Data:
${JSON.stringify(resume || {})}

Return ONLY a valid JSON object in this exact format, and DO NOT use any emojis in your response:
{
  "matchScore": 72,
  "summary": "Brief 2-sentence summary of overall fit",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "gaps": [
    { "keyword": "Missing Keyword", "importance": "high", "suggestion": "How to address this gap" }
  ],
  "recommendations": ["Action item 1", "Action item 2", "Action item 3"],
  "keywordsFound": ["Keyword 1", "Keyword 2"],
  "keywordsMissing": ["Missing 1", "Missing 2"]
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.5,
            response_format: { type: "json_object" },
            messages: [{ role: "system", content: systemPrompt }]
        });

        const data = JSON.parse(completion.choices[0].message.content);
        await trackAPIUsage(userId, "career-job-match");
        return NextResponse.json(data);
    } catch (error) {
        console.error("Job match error:", error);
        return NextResponse.json({ error: "Failed to analyze job match" }, { status: 500 });
    }
}

export const POST = combineMiddleware(
    withErrorHandling,
    withCsrf,
    withAuth,
    (h) => withAPIRateLimit(h, "career")
)(handlePost);

export const dynamic = "force-dynamic";
