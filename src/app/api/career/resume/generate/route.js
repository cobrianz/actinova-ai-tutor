import OpenAI from "openai";
import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { withAPIRateLimit, trackAPIUsage } from "@/lib/planMiddleware";
import CareerHistory from "@/models/CareerHistory";
import dbConnect from "@/lib/dbConnect";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function handlePost(request) {
  const user = request.user;
  const userId = user._id;

  try {
    const body = await request.json();
    const { role } = body;

    if (!role?.trim()) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    const systemPrompt = `You are a professional resume writer.
Create a comprehensive, professional resume for a candidate applying for the role: "${role}".
Use the candidate's name: "${user.firstName} ${user.lastName}".
Email: "${user.email}".

Provide the output in a structured JSON format.

JSON Structure:
{
  "personalInfo": {
     "name": "${user.firstName} ${user.lastName}",
     "email": "${user.email}",
     "title": "${role}"
  },
  "summary": "Professional summary...",
  "experience": [
    {
      "company": "Company Name",
      "position": "Title",
      "duration": "Dates",
      "highlights": ["bullet point 1", "bullet point 2"]
    }
  ],
  "education": [
    {
      "school": "University Name",
      "degree": "Degree Name",
      "year": "Year"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"]
}

Ensure the content is high-quality, ATS-optimized, and specifically tailored to the ${role} position.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: systemPrompt }]
    });

    const data = JSON.parse(completion.choices[0].message.content);

    await dbConnect();
    const history = new CareerHistory({
      userId,
      type: "resume",
      title: role,
      data: data,
      metadata: { role }
    });
    await history.save();

    await trackAPIUsage(userId, "career-resume-gen");

    return NextResponse.json(data);
  } catch (error) {
    console.error("Resume generation error:", error);
    return NextResponse.json({ error: "Failed to generate resume" }, { status: 500 });
  }
}

export const POST = combineMiddleware(
  withErrorHandling,
  withCsrf,
  withAuth,
  (h) => withAPIRateLimit(h, "career")
)(handlePost);

export const dynamic = "force-dynamic";
