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
    const {
      action, // "outreach" | "mentorship"
      targetPerson, // For outreach: { name, role, company, context }
      userSkills,
      careerGoals,
      platform // "linkedin" | "email"
    } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "outreach") {
      systemPrompt = `You are an elite career coach specializing in professional networking.
Generate 3 distinct versions of a highly personalized networking message for the user.
- Version 1: Casual & Direct (Low pressure)
- Version 2: Professional & Focused (Value-driven)
- Version 3: Curious & Academic (Seeking advice/mentorship)

The messages should be optimized for ${platform || 'LinkedIn'}.
Provide the output in JSON format.

JSON Structure:
{
  "messages": [
    { "title": "Casual", "content": "..." },
    { "title": "Professional", "content": "..." },
    { "title": "Advice Seeker", "content": "..." }
  ],
  "tips": ["Best time to send", "Follow-up strategy"]
}`;
      userPrompt = `User's Skills: ${userSkills}
Target Person: ${targetPerson.name}, ${targetPerson.role} at ${targetPerson.company}
Context: ${targetPerson.context || "Expanding professional network"}
User's Career Goals: ${careerGoals}`;

    } else if (action === "mentorship") {
      systemPrompt = `You are a professional mentorship advisor.
Based on the user's background and goals, suggest 3 'archetypes' of mentors they should seek out.
Explain WHY these personas are valuable and how to find them.

JSON Structure:
{
  "mentorArchetypes": [
    {
      "persona": "Title of the archetype",
      "expertise": "What they excel at",
      "valueAdd": "How they help this specific user",
      "searchKeywords": ["keyword1", "keyword2"]
    }
  ],
  "strategy": "Overall approach to securing a mentor"
}`;
      userPrompt = `User's Skills: ${userSkills}
Career Goals: ${careerGoals}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    const result = JSON.parse(completion.choices[0].message.content);

    await dbConnect();
    const history = new CareerHistory({
      userId,
      type: "network",
      title: action === "outreach" ? (targetPerson?.name || "Outreach") : "Mentorship Strategy",
      data: result,
      metadata: { action, platform, targetPerson, userSkills, careerGoals }
    });
    await history.save();

    await trackAPIUsage(userId, "career");

    return NextResponse.json(result);
  } catch (error) {
    console.error("Network AI error:", error);
    return NextResponse.json({ error: "Failed to process Network AI request" }, { status: 500 });
  }
}

export const POST = combineMiddleware(
  withErrorHandling,
  withCsrf,
  withAuth,
  (h) => withAPIRateLimit(h, "career")
)(handlePost);

export const dynamic = "force-dynamic";
