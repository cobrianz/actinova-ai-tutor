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
        const { courseName } = body;

        const role = courseName || "Software Developer";

        const systemPrompt = `You are a professional resume writer.
Create a comprehensive, professional resume for a candidate who has completed a course in "${role}".
Candidate name: "${user.firstName || ""} ${user.lastName || ""}".
Email: "${user.email}".

The resume should highlight skills and projects relevant to the "${role}" course content.
Generate realistic and impressive experience and projects that would be expected from someone who completed such a course.

Return ONLY a valid JSON object in this format:
{
  "personalInfo": {
    "fullName": "${user.firstName || ""} ${user.lastName || ""}",
    "name": "${user.firstName || ""} ${user.lastName || ""}",
    "email": "${user.email}",
    "jobTitle": "${role} Developer"
  },
  "summary": "2-3 sentence professional summary...",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, Country",
      "startDate": "Jan 2023",
      "endDate": "Present",
      "description": "Description of responsibilities and achievements..."
    }
  ],
  "education": [
    {
      "school": "University Name",
      "degree": "Degree Name",
      "location": "City",
      "startDate": "2019",
      "endDate": "2023"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Description of the project",
      "technologies": "Tech1, Tech2"
    }
  ]
}`;

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
            title: `${role} Resume`,
            data: data,
            metadata: { role, source: "library" }
        });
        await history.save();

        await trackAPIUsage(userId, "career-resume-gen");

        return NextResponse.json(data);
    } catch (error) {
        console.error("Library resume generation error:", error);
        return NextResponse.json({ error: "Failed to generate resume from library" }, { status: 500 });
    }
}

export const POST = combineMiddleware(
    withErrorHandling,
    withCsrf,
    withAuth,
    (h) => withAPIRateLimit(h, "career")
)(handlePost);

export const dynamic = "force-dynamic";
