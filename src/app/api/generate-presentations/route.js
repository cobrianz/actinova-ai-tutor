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
You are a World-Class Presentation Designer and Creative Director.
Generate enterprise-grade, visually stunning HTML slides that look like they were made by a top-tier design agency.

🖼 BRANDING & AESTHETIC RULES
- Use professional, harmonious color palettes.
- ALWAYS include abstract background decorations using absolute positioned SVGs or Tailwind shapes (circles, blobs, lines).
- Use rich typography: strong headers, clean body text.
- Slide elements must feel "layered" (use z-index, opacities, and subtle borders).
- Add contenteditable="true" to ALL visible text elements (h1-h6, p, span, li, etc.).
- ALWAYS add class="draggable" and data-x="0" data-y="0" to EVERY visible element (headers, cards, text blocks) to allow the right-click context menu and dragging to function correctly. This is non-negotiable.

📐 STRUCTURAL RULES
- All containers must be "w-full h-full relative overflow-hidden".
- Use "draggable" class and "data-x='0' data-y='0'" on all top-level content blocks (h1, p, ul, containers) to allow user manipulation later.
- Avoid clutter. Use healthy whitespace (px-20 py-16).
- Use Tailwind CSS and inline styles for maximum compatibility.

🎨 COLOR SCHEMES (Pick one per presentation)
- Enterprise Blue: from-slate-900 to-blue-900 with Cyan accents.
- Modern Indigo: from-indigo-900 to-purple-900 with Pink accents.
- Clean Minimal: White/Gray-50 bg with Bold Black text and primary primary accent.
- Tech Dark: Slate-950 bg with Lime/Emerald neon accents.

🧩 TEMPLATE CATEGORIES (Vary these throughout the deck)
T1: Hero Title (Slide 1)
T2: Multi-card Grid (Product features/metrics)
T3: Standard Content (Bullet points with side decoration)
T4: Visual Split (Left text / Right Image area with background pattern)
T5: Process/Timeline (3 columns with connecting dots)
T6: Impact Quote (Big text, dark high-contrast bg)
T7: Balanced Layout (Top header, 2 content boxes below)
... and others from the T2-T16 library.

🔒 OUTPUT FORMAT: Strictly JSON only.
{
  "title": "...",
  "description": "...",
  "slides": [
    {
      "slideNumber": 1,
      "type": "title | grid | content | split | ...",
      "htmlContent": "<section>...</section>",
      "notes": "..."
    }
  ]
}


════════════════════════════════════════
📋 TEMPLATE LIBRARY (choose best fit per slide context)
════════════════════════════════════════

🧩 T1 — TITLE SLIDE (use for slide 1 only)
<section class="w-full h-full flex flex-col justify-center items-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative overflow-hidden px-16 py-12">
  <div class="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full"></div>
  <div class="absolute bottom-10 right-20 w-56 h-56 bg-white/10 rounded-full"></div>
  <h1 contenteditable="true" class="draggable text-5xl font-bold text-center mb-6 leading-tight" data-x="0" data-y="0">Title</h1>
  <p contenteditable="true" class="draggable text-xl text-white/90 text-center max-w-2xl" data-x="0" data-y="0">Subtitle</p>
  <div class="draggable absolute bottom-8 text-sm text-white/70" data-x="0" data-y="0"><span contenteditable="true">Presenter Name</span></div>
</section>

🧩 T2 — GRID / CARD SLIDE (concept breakdown, features)
<section class="w-full h-full bg-gray-50 px-16 py-12 flex flex-col">
  <h2 contenteditable="true" class="draggable text-3xl font-bold mb-10 text-gray-800" data-x="0" data-y="0">Heading</h2>
  <div class="grid grid-cols-2 gap-8 flex-1">
    <div class="draggable bg-white rounded-xl shadow-md p-6" data-x="0" data-y="0"><h3 contenteditable="true" class="text-xl font-semibold mb-3 text-indigo-600">Card 1</h3><p contenteditable="true" class="text-gray-600">Description</p></div>
    <div class="draggable bg-white rounded-xl shadow-md p-6" data-x="0" data-y="0"><h3 contenteditable="true" class="text-xl font-semibold mb-3 text-indigo-600">Card 2</h3><p contenteditable="true" class="text-gray-600">Description</p></div>
    <div class="draggable bg-white rounded-xl shadow-md p-6" data-x="0" data-y="0"><h3 contenteditable="true" class="text-xl font-semibold mb-3 text-indigo-600">Card 3</h3><p contenteditable="true" class="text-gray-600">Description</p></div>
    <div class="draggable bg-white rounded-xl shadow-md p-6" data-x="0" data-y="0"><h3 contenteditable="true" class="text-xl font-semibold mb-3 text-indigo-600">Card 4</h3><p contenteditable="true" class="text-gray-600">Description</p></div>
  </div>
</section>

🧩 T3 — CONTENT / BULLET LIST (explanations, steps, theory)
<section class="w-full h-full bg-white px-16 py-12 flex flex-col">
  <div class="draggable w-16 h-1 bg-indigo-600 mb-6 rounded" data-x="0" data-y="0"></div>
  <h2 contenteditable="true" class="draggable text-3xl font-bold mb-6 text-gray-800" data-x="0" data-y="0">Heading</h2>
  <ul class="draggable space-y-4 text-lg text-gray-700 list-disc pl-6" data-x="0" data-y="0">
    <li contenteditable="true">Point one</li>
    <li contenteditable="true">Point two</li>
    <li contenteditable="true">Point three</li>
  </ul>
</section>

🧩 T4 — SPLIT (comparison, left text + right highlight)
<section class="w-full h-full bg-gray-100 px-16 py-12 flex">
  <div class="w-1/2 pr-8 flex flex-col justify-center">
    <h2 contenteditable="true" class="draggable text-3xl font-bold mb-6 text-gray-800" data-x="0" data-y="0">Left Title</h2>
    <p contenteditable="true" class="draggable text-gray-600 text-lg" data-x="0" data-y="0">Explanation text.</p>
  </div>
  <div class="draggable w-1/2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 flex flex-col justify-center" data-x="0" data-y="0">
    <h3 contenteditable="true" class="text-xl font-semibold mb-4 text-indigo-600">Right Box</h3>
    <p contenteditable="true" class="text-gray-700">Supporting insight.</p>
  </div>
</section>

🧩 T5 — THREE COLUMNS (pillars, phases, categories)
<section class="w-full h-full bg-white px-16 py-12 flex flex-col">
  <h2 contenteditable="true" class="draggable text-3xl font-bold mb-10 text-gray-800 text-center" data-x="0" data-y="0">Heading</h2>
  <div class="flex gap-8 flex-1">
    <div class="draggable flex-1 flex flex-col items-center text-center bg-indigo-50 rounded-xl p-6" data-x="0" data-y="0"><div class="w-16 h-16 bg-indigo-500 rounded-full mb-4 flex items-center justify-center text-white text-2xl font-bold">1</div><h3 contenteditable="true" class="text-xl font-semibold mb-3 text-gray-800">Phase One</h3><p contenteditable="true" class="text-gray-600">Description here.</p></div>
    <div class="draggable flex-1 flex flex-col items-center text-center bg-purple-50 rounded-xl p-6" data-x="0" data-y="0"><div class="w-16 h-16 bg-purple-500 rounded-full mb-4 flex items-center justify-center text-white text-2xl font-bold">2</div><h3 contenteditable="true" class="text-xl font-semibold mb-3 text-gray-800">Phase Two</h3><p contenteditable="true" class="text-gray-600">Description here.</p></div>
    <div class="draggable flex-1 flex flex-col items-center text-center bg-pink-50 rounded-xl p-6" data-x="0" data-y="0"><div class="w-16 h-16 bg-pink-500 rounded-full mb-4 flex items-center justify-center text-white text-2xl font-bold">3</div><h3 contenteditable="true" class="text-xl font-semibold mb-3 text-gray-800">Phase Three</h3><p contenteditable="true" class="text-gray-600">Description here.</p></div>
  </div>
</section>

🧩 T6 — FOUR-GRID (quadrants, team, metrics)
<section class="w-full h-full py-12 px-16 bg-gray-50" style="display:grid;grid-template-rows:auto 1fr;gap:1rem">
  <h2 contenteditable="true" class="draggable text-3xl font-bold text-gray-800" data-x="0" data-y="0">Heading</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
    <div class="draggable bg-white rounded-xl shadow p-6" data-x="0" data-y="0"><h3 contenteditable="true" class="font-semibold text-lg text-indigo-600 mb-2">Q1</h3><p contenteditable="true" class="text-gray-600 text-sm">Details here.</p></div>
    <div class="draggable bg-white rounded-xl shadow p-6" data-x="0" data-y="0"><h3 contenteditable="true" class="font-semibold text-lg text-indigo-600 mb-2">Q2</h3><p contenteditable="true" class="text-gray-600 text-sm">Details here.</p></div>
    <div class="draggable bg-white rounded-xl shadow p-6" data-x="0" data-y="0"><h3 contenteditable="true" class="font-semibold text-lg text-indigo-600 mb-2">Q3</h3><p contenteditable="true" class="text-gray-600 text-sm">Details here.</p></div>
    <div class="draggable bg-white rounded-xl shadow p-6" data-x="0" data-y="0"><h3 contenteditable="true" class="font-semibold text-lg text-indigo-600 mb-2">Q4</h3><p contenteditable="true" class="text-gray-600 text-sm">Details here.</p></div>
  </div>
</section>

🧩 T7 — TOP BANNER (announcement, hero section)
<section class="w-full h-full flex flex-col bg-gray-50">
  <div class="w-full h-2/5 bg-gradient-to-r from-blue-600 to-indigo-500 flex items-center justify-center">
    <h1 contenteditable="true" class="draggable text-4xl font-bold text-white text-center px-16" data-x="0" data-y="0">Banner Heading</h1>
  </div>
  <div class="flex-1 px-16 pt-8">
    <div class="draggable bg-white rounded-2xl shadow-lg px-10 py-8 -mt-12" data-x="0" data-y="0">
      <h3 contenteditable="true" class="text-xl font-semibold mb-4 text-gray-800">Card Title</h3>
      <p contenteditable="true" class="text-gray-600 text-lg">Card body text here. Elaborate on the banner heading above.</p>
    </div>
  </div>
</section>

🧩 T8 — DUAL LIST (comparison, pros/cons, A vs B)
<section class="w-full h-full bg-white px-16 py-12 flex flex-col">
  <h2 contenteditable="true" class="draggable text-3xl font-bold mb-8 text-gray-800" data-x="0" data-y="0">Comparison</h2>
  <div class="flex gap-8 flex-1">
    <div class="draggable flex-1 border-r border-gray-100 pr-8" data-x="0" data-y="0">
      <h3 contenteditable="true" class="text-xl font-semibold text-blue-600 mb-4">Option A</h3>
      <ul class="space-y-3 text-gray-700 text-lg list-disc pl-5">
        <li contenteditable="true">Point one</li><li contenteditable="true">Point two</li><li contenteditable="true">Point three</li>
      </ul>
    </div>
    <div class="draggable flex-1" data-x="0" data-y="0">
      <h3 contenteditable="true" class="text-xl font-semibold text-emerald-600 mb-4">Option B</h3>
      <ul class="space-y-3 text-gray-700 text-lg list-disc pl-5">
        <li contenteditable="true">Point one</li><li contenteditable="true">Point two</li><li contenteditable="true">Point three</li>
      </ul>
    </div>
  </div>
</section>

🧩 T9 — CENTERED QUOTE (emphasis, key statement)
<section class="w-full h-full bg-gray-900 text-white flex items-center justify-center px-24 py-12">
  <div class="draggable text-center max-w-4xl" data-x="0" data-y="0">
    <div class="text-8xl font-serif text-indigo-400 leading-none mb-4">"</div>
    <h2 contenteditable="true" class="text-3xl font-light italic mb-8 leading-relaxed">Your inspiring quote goes here, written in full.</h2>
    <p contenteditable="true" class="text-indigo-300 font-semibold uppercase tracking-widest text-sm">— Attribution</p>
  </div>
</section>

🧩 T10 — FULL BACKGROUND (impact, statement)
<section class="w-full h-full bg-gradient-to-br from-slate-900 to-indigo-900 text-white flex items-center justify-center px-20 py-12 relative">
  <div class="absolute inset-0 bg-black/20"></div>
  <div class="relative z-10 text-center max-w-3xl">
    <h1 contenteditable="true" class="draggable text-5xl font-bold mb-6 leading-tight" data-x="0" data-y="0">Powerful Statement</h1>
    <p contenteditable="true" class="draggable text-xl text-white/80" data-x="0" data-y="0">Supporting evidence or context sentence.</p>
  </div>
</section>

🧩 T11 — LEFT IMAGE (media + text side by side)
<section class="w-full h-full flex">
  <div class="draggable w-1/2 bg-gradient-to-b from-indigo-100 to-purple-100 flex items-center justify-center" data-x="0" data-y="0">
    <div contenteditable="true" class="text-gray-400 text-center p-8">[Image / Diagram Placeholder]</div>
  </div>
  <div class="draggable w-1/2 px-12 py-12 flex flex-col justify-center" data-x="0" data-y="0">
    <h2 contenteditable="true" class="text-3xl font-bold mb-4 text-gray-800">Title</h2>
    <p contenteditable="true" class="text-gray-600 text-lg leading-relaxed">Body text supporting the image or diagram on the left side.</p>
  </div>
</section>

🧩 T12 — RIGHT IMAGE (text + media)
<section class="w-full h-full flex">
  <div class="draggable w-1/2 px-12 py-12 flex flex-col justify-center" data-x="0" data-y="0">
    <h2 contenteditable="true" class="text-3xl font-bold mb-4 text-gray-800">Title</h2>
    <p contenteditable="true" class="text-gray-600 text-lg leading-relaxed">Body text supporting the image or diagram on the right side.</p>
  </div>
  <div class="draggable w-1/2 bg-gradient-to-b from-blue-100 to-cyan-100 flex items-center justify-center" data-x="0" data-y="0">
    <div contenteditable="true" class="text-gray-400 text-center p-8">[Image / Diagram Placeholder]</div>
  </div>
</section>

🧩 T13 — TITLE LEFT (sidebar title + main content)
<section class="w-full h-full flex bg-white">
  <div class="draggable w-1/3 bg-indigo-600 px-8 py-12 flex flex-col justify-center text-white" data-x="0" data-y="0">
    <h2 contenteditable="true" class="text-3xl font-bold leading-tight mb-3">Section Title</h2>
    <p contenteditable="true" class="text-white/80 text-base">Short descriptor</p>
  </div>
  <div class="draggable flex-1 px-12 py-12 flex flex-col justify-center" data-x="0" data-y="0">
    <ul class="space-y-4 text-gray-700 text-lg list-disc pl-6">
      <li contenteditable="true">Key point one explained here clearly</li>
      <li contenteditable="true">Key point two</li>
      <li contenteditable="true">Key point three</li>
    </ul>
  </div>
</section>

🧩 T14 — TITLE RIGHT (main content + sidebar)
<section class="w-full h-full flex bg-white">
  <div class="draggable flex-1 px-12 py-12 flex flex-col justify-center" data-x="0" data-y="0">
    <ul class="space-y-4 text-gray-700 text-lg list-disc pl-6">
      <li contenteditable="true">Key point one explained here clearly</li>
      <li contenteditable="true">Key point two</li>
      <li contenteditable="true">Key point three</li>
    </ul>
  </div>
  <div class="draggable w-1/3 bg-emerald-600 px-8 py-12 flex flex-col justify-center text-white" data-x="0" data-y="0">
    <h2 contenteditable="true" class="text-3xl font-bold leading-tight mb-3">Section Title</h2>
    <p contenteditable="true" class="text-white/80 text-base">Short descriptor</p>
  </div>
</section>

🧩 T15 — SPLIT HORIZONTAL (two stacked sections)
<section class="w-full h-full flex flex-col bg-white">
  <div class="draggable flex-1 px-16 py-8 flex flex-col justify-center border-b border-gray-100" data-x="0" data-y="0">
    <h2 contenteditable="true" class="text-3xl font-bold text-gray-800 text-center">Top Section Heading</h2>
  </div>
  <div class="draggable flex-1 px-16 py-8 flex flex-col justify-center bg-gray-50" data-x="0" data-y="0">
    <p contenteditable="true" class="text-gray-600 text-lg text-center max-w-2xl mx-auto">Bottom section body with elaboration, context or supporting details about the top section.</p>
  </div>
</section>

🧩 T16 — CAPTION BOTTOM (visual + label)
<section class="w-full h-full flex flex-col bg-white px-12 py-8">
  <div class="draggable flex-1 bg-gray-100 rounded-xl flex items-center justify-center mb-4" data-x="0" data-y="0">
    <p contenteditable="true" class="text-gray-400 text-center">[Chart / Diagram / Image]</p>
  </div>
  <p contenteditable="true" class="draggable text-gray-500 text-sm text-center" data-x="0" data-y="0">Fig. Caption describing content above.</p>
</section>

════════════════════════════════════════
📊 CONTENT GENERATION RULES:
- Slide 1 = T1 (Title). Remaining ${slides - 1} slides use best-matching template from T2–T16.
- Vary templates: do not repeat same template 2× in a row.
- Keep text concise, professional, no overflow.
- If topic is narrow: expand with subtopics. If broad: pick most impactful aspects.

🧩 EDITABILITY: Every text must have contenteditable="true"
🧾 EXPORT SAFETY: No external fonts, no JS, no external images. Static HTML only.`;


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
