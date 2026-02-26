// src/app/api/generate-presentations/route.js

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getUserPlanLimits } from "@/lib/planLimits";
import { withAuth, withErrorHandling } from "@/lib/middleware";
import { trackAPIUsage } from "@/lib/planMiddleware";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1"
});

async function handlePost(request) {
  const user = request.user;
  const userId = user._id;

  try {
    const body = await request.json();
    let {
      topic,
      difficulty = "beginner",
      slides = 10,
      style = "professional",
    } = body;

    if (!topic?.trim())
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });

    difficulty = (difficulty || "beginner").toLowerCase();
    if (!["beginner", "intermediate", "advanced"].includes(difficulty))
      return NextResponse.json(
        { error: "Invalid difficulty" },
        { status: 400 }
      );

    if (slides < 5 || slides > 50)
      return NextResponse.json(
        { error: "Slides must be between 5 and 50" },
        { status: 400 }
      );

    const { db } = await connectToDatabase();
    const planLimits = getUserPlanLimits(user);
    const isPremium = user?.subscription?.plan === "pro" || user?.subscription?.plan === "enterprise" && user?.subscription?.status === "active";

    // Generate presentation content using OpenAI
    const prompt = `Create a comprehensive presentation outline about "${topic}" with ${slides} slides at ${difficulty} level.

Format the response as a JSON object with the following structure:
{
  "title": "Presentation Title",
  "description": "Brief description",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide Title",
      "content": ["bullet point 1", "bullet point 2", ...],
      "notes": "Speaker notes for this slide"
    },
    ...
  ]
}

Guidelines:
- First slide should be a title slide with the main topic
- Include an overview/agenda slide near the beginning
- Include multiple content slides with key points
- End with conclusion/summary slide
- Each content slide should have 3-5 bullet points
- All content should be at ${difficulty} level of detail
- Make it engaging and educational`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a professional presentation designer. Create well-structured, engaging presentation outlines."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    let presentationData;
    try {
      presentationData = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      return NextResponse.json(
        { error: "Failed to parse presentation data from AI" },
        { status: 500 }
      );
    }

    // Save presentation to database
    const presentation = {
      userId: new ObjectId(userId),
      title: presentationData.title,
      description: presentationData.description,
      topic: topic.trim().toLowerCase(),
      difficulty,
      slides: presentationData.slides,
      totalSlides: slides,
      style,
      createdAt: new Date(),
      updatedAt: new Date(),
      format: "presentation",
    };

    const result = await db.collection("presentations").insertOne(presentation);

    // Update user usage
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $inc: { "usage.presentations": 1 },
        $set: { "usage.lastGeneratedAt": new Date() }
      }
    );

    return NextResponse.json({
      success: true,
      presentation: {
        _id: result.insertedId,
        ...presentation,
        createdAt: presentation.createdAt.toISOString(),
        updatedAt: presentation.updatedAt.toISOString(),
      }
    });

  } catch (error) {
    console.error("Presentation generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate presentation" },
      { status: 500 }
    );
  }
}

export const POST = withErrorHandling(withAuth(handlePost));
export const runtime = "nodejs";
