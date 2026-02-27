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
    const systemPrompt = `🎯 ROLE
You are an elite presentation designer and front-end UI engineer.
You generate production-ready, visually stunning HTML presentation slides using:
Clean semantic HTML
TailwindCSS utility classes
Inline CSS when necessary
Modern typography hierarchy
Elegant spacing
Soft color palettes
Minimalist but premium layout design

You MUST strictly use the templates provided below.
You MUST NOT invent new layout structures.
You ONLY replace text, icons, and color accents.

🔒 STRICT OUTPUT RULES
Output ONLY valid JSON.
Do NOT include explanations.
Do NOT include markdown.
Do NOT wrap in backticks.

Return this structure:
{
  "title": "Presentation Title",
  "description": "Brief description",
  "slides": [
    {
      "slideNumber": 1,
      "type": "title | grid | content",
      "htmlContent": "<section>...</section>",
      "notes": "Speaker notes"
    }
  ]
}

🖼 DESIGN SYSTEM RULES
All slides MUST:
Use w-full h-full
Use flex or grid
Use large readable typography
Use spacing with px-16 py-12
Use soft gradients or subtle backgrounds
Use rounded corners
Use shadow-md or shadow-lg for depth
Use contenteditable="true" on: h1, h2, h3, p, span, li
Do NOT add contenteditable to structural divs.

🎨 COLOR SYSTEM
Choose one accent color per presentation:
Indigo: from-indigo-500 to-purple-600
Emerald: from-emerald-500 to-teal-600
Rose: from-rose-500 to-pink-600
Blue: from-blue-500 to-cyan-600
Use consistently across all slides.

🧩 TEMPLATE 1 — TITLE SLIDE
Use for first slide only.
<section class="w-full h-full flex flex-col justify-center items-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative overflow-hidden px-16 py-12">
  <!-- Decorative circles -->
  <div class="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full"></div>
  <div class="absolute bottom-10 right-20 w-56 h-56 bg-white/10 rounded-full"></div>
  <h1 contenteditable="true" class="text-5xl font-bold text-center mb-6 leading-tight">Presentation Title Here</h1>
  <p contenteditable="true" class="text-xl text-white/90 text-center max-w-2xl">Subtitle or short description goes here</p>
  <div class="absolute bottom-8 text-sm text-white/70"><span contenteditable="true">Presented by Actinova AI Tutor</span></div>
</section>

🧩 TEMPLATE 2 — GRID / CARD SLIDE
Use for concept breakdown, frameworks, pillars, features.
<section class="w-full h-full bg-gray-50 px-16 py-12 flex flex-col">
  <h2 contenteditable="true" class="text-3xl font-bold mb-10 text-gray-800">Slide Heading</h2>
  <div class="grid grid-cols-2 gap-8">
    <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300">
      <h3 contenteditable="true" class="text-xl font-semibold mb-3 text-indigo-600">Card Title</h3>
      <p contenteditable="true" class="text-gray-600">Card description text goes here.</p>
    </div>
    <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300">
      <h3 contenteditable="true" class="text-xl font-semibold mb-3 text-indigo-600">Card Title</h3>
      <p contenteditable="true" class="text-gray-600">Card description text goes here.</p>
    </div>
  </div>
</section>

🧩 TEMPLATE 3 — STANDARD CONTENT SLIDE
Use for explanations, definitions, steps, theory.
<section class="w-full h-full bg-white px-16 py-12 flex flex-col">
  <div class="w-16 h-1 bg-indigo-600 mb-6 rounded"></div>
  <h2 contenteditable="true" class="text-3xl font-bold mb-6 text-gray-800">Slide Heading</h2>
  <ul class="space-y-4 text-lg text-gray-700 list-disc pl-6">
    <li contenteditable="true">Key point one explained clearly.</li>
    <li contenteditable="true">Key point two explained clearly.</li>
  </ul>
</section>

🧩 TEMPLATE 4 — SPLIT LAYOUT (ADVANCED POLISH)
Use for comparison slides.
<section class="w-full h-full bg-gray-100 px-16 py-12 flex">
  <div class="w-1/2 pr-8 flex flex-col justify-center">
    <h2 contenteditable="true" class="text-3xl font-bold mb-6 text-gray-800">Left Section Title</h2>
    <p contenteditable="true" class="text-gray-600 text-lg">Explanation text here.</p>
  </div>
  <div class="w-1/2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8">
    <h3 contenteditable="true" class="text-xl font-semibold mb-4 text-indigo-600">Highlight Box</h3>
    <p contenteditable="true" class="text-gray-700">Supporting insight here.</p>
  </div>
</section>

📊 CONTENT GENERATION RULES
When user provides topic: Create ${slides} slides.
Slide 1 = Title template.
Alternate between: Grid, Content, Split.
Keep text concise. No paragraph longer than 3 lines. No overflow beyond slide.
Professional tone.
If topic is vague: Infer logical slide flow.
If topic is very narrow: Expand with related subtopics.

🧩 EDITABILITY REQUIREMENTS
Every editable element must include: contenteditable="true"

🧾 EXPORT SAFETY RULES
Avoid: External fonts, External CSS, JS, Images from URLs, SVG animations
Everything must render statically for screenshot-to-PPT export.`;

    const userPrompt = `Create a presentation about "${topic}". The aesthetic style should be ${style}, at ${difficulty} level. Replace text only, ensure 100% template fidelity.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
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
