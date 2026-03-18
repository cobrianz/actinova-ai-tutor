// src/app/api/explore/trending/route.js

import { NextResponse } from "next/server";
import OpenAI from "openai";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CURRENT_YEAR = new Date().getFullYear();

// Cache expires every Saturday at midnight
function getLatestSaturdayMidnight() {
  const now = new Date();
  const day = now.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = (day + 1) % 7; // days since last Saturday
  const lastSaturday = new Date(now);
  lastSaturday.setDate(now.getDate() - diff);
  lastSaturday.setHours(0, 0, 0, 0);
  return lastSaturday;
}

export async function generateExploreTrending() {
  const { db } = await connectToDatabase();
  const userId = "global_trending";

  try {
    // Shared trending - no personalization context needed to save API and ensures consistency
    const personalization = `\n\nEnsure a balanced mix of 12 courses across multiple fields: Tech, Business, Health, Arts, Science, and Lifestyle. At least 2 courses from each major pillar.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are the world's best learning experience curator in ${CURRENT_YEAR}.

Generate EXACTLY 12 irresistible, currently trending online course topics that learners are obsessed with right now.

IMPORTANT: Cover DIVERSE fields beyond just technology. Include:
- Technology (AI, Programming, Web Development, etc.)
- Business & Entrepreneurship (Marketing, Finance, Management, etc.)
- Health & Wellness (Fitness, Nutrition, Mental Health, Medicine, etc.)
- Creative Arts (Design, Music, Writing, Photography, Art, etc.)
- Humanities (History, Philosophy, Languages, Literature, etc.)
- Science (Physics, Chemistry, Biology, Astronomy, etc.)
- Lifestyle (Cooking, Gardening, Crafts, Personal Development, etc.)
- Professional Skills (Leadership, Communication, Project Management, etc.)
- Trades & Technical Skills (Carpentry, Plumbing, Electrical, etc.)
- Education & Teaching (Pedagogy, Curriculum Design, etc.)

Ensure variety - NOT all tech courses. Mix different fields based on what's trending globally.

Each topic must include:
- A magnetic title (short & punchy)
- A description that makes you want to enroll instantly
- One clear category
- Realistic difficulty + duration
- 4 perfect tags
- A "whyTrending" that feels urgent and real
- 3-4 real learner questions with helpful answers
- A "hook" field: one bold promise (e.g. "Go from zero to hired in 10 weeks")

Return ONLY a clean JSON array. No markdown. No extra text.

Make them feel fresh, actionable, and impossible to ignore.${personalization}`,
        },
        {
          role: "user",
          content: `Give me the 6 hottest, most in-demand online course topics for ${CURRENT_YEAR} — right now, today. Make them diverse, exciting, and perfectly relevant to real learners.`,
        },
      ],
      temperature: 0.9,
      max_tokens: 3000,
    });

    let topics = [];

    try {
      const raw = completion.choices[0].message.content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(raw);
      topics = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("AI JSON parse failed:", e);
    }

    // === 4. Ultimate Fallback ===
    if (topics.length < 12) {
      const fallbacks = getFallbackTopics();
      // Combine AI topics with fallbacks to ensure exactly 12
      const combined = [...topics];
      fallbacks.forEach(f => {
        if (combined.length < 12 && !combined.find(t => t.title === f.title)) {
          combined.push(f);
        }
      });
      topics = combined;
    }

    // === 5. Cache Results (Shared global cache) ===
    await db.collection("explore_trending").deleteMany({ userId: "global_trending" });
    await db.collection("explore_trending").insertOne({
      userId: "global_trending",
      topics: topics.slice(0, 12),
      createdAt: new Date(),
      generatedForUser: "global",
      model: "gpt-4o-mini",
    });

    return {
      success: true,
      topics: topics.slice(0, 12),
      source: "ai-generated",
      refreshedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Explore Trending generation error:", error);
    return {
      success: true,
      topics: getFallbackTopics(),
      source: "fallback",
      refreshedAt: new Date().toISOString(),
    };
  }
}

function getFallbackTopics() {
  return [
    {
      title: "AI Agent Engineering",
      description: "Build autonomous AI agents that run your business, research, and life — no code required",
      category: "AI",
      difficulty: "intermediate",
      estimatedDuration: "8 weeks",
      tags: ["AI Agents", "Automation", "n8n", "CrewAI"],
      whyTrending: "AI agents are replacing apps and junior roles in 2025",
      hook: "Launch your first money-making agent in week 3",
      questions: [
        { question: "Do I need to code?", answer: "No — visual builders + templates included" },
        { question: "Can agents make money?", answer: "Yes — students are earning $2k+/mo with lead-gen agents" },
      ],
    },
    {
      title: "Next.js 15 Mastery",
      description: "Build blazing-fast, SEO-perfect apps with React Server Components and Partial Prerendering",
      category: "Programming",
      difficulty: "intermediate",
      estimatedDuration: "10 weeks",
      tags: ["Next.js", "React", "TypeScript", "App Router"],
      whyTrending: "Next.js 15 is the new industry standard — used by Vercel, Netflix, Shopify",
      hook: "Deploy production apps that rank #1 on Google",
      questions: [
        { question: "Is Next.js still worth learning?", answer: "More than ever — 80% of new React jobs require it" },
        { question: "What’s new in v15?", answer: "Partial Prerendering = instant load + dynamic data" },
      ],
    },
    {
      title: "Prompt Engineering Pro",
      description: "Master the #1 skill of 2025: turn any AI into an expert in seconds",
      category: "AI",
      difficulty: "beginner",
      estimatedDuration: "5 weeks",
      tags: ["Prompting", "ChatGPT", "Claude", "Gemini"],
      whyTrending: "One good prompt = 100 hours saved. This is the new literacy",
      hook: "10x your output in any field — writing, coding, design, research",
      questions: [
        { question: "Is this really a career skill?", answer: "Yes — Prompt Engineer roles pay $300k+ at startups" },
      ],
    },
    {
      title: "Freelance to $10k/mo",
      description: "Go from zero clients to fully booked using AI, automation, and smart positioning",
      category: "Business",
      difficulty: "beginner",
      estimatedDuration: "8 weeks",
      tags: ["Freelancing", "Client Acquisition", "AI Tools"],
      whyTrending: "Remote freelance economy grew 40% in 2025",
      hook: "Land your first $5k client in 30 days",
      questions: [
        { question: "Can anyone do this?", answer: "Yes — even with basic skills + AI leverage" },
      ],
    },
    {
      title: "Figma + AI Design System",
      description: "Design 10x faster with AI-generated UI, auto-layout, and component libraries",
      category: "Design",
      difficulty: "beginner",
      estimatedDuration: "6 weeks",
      tags: ["Figma", "UI/UX", "AI Design", "Design Systems"],
      whyTrending: "AI is making designers superhuman — not replacing them",
      hook: "Go from idea to pixel-perfect prototype in 1 day",
      questions: [
        { question: "Will AI replace designers?", answer: "No — it makes great designers unstoppable" },
      ],
    },
    {
      title: "Longevity Science & Biohacking",
      description: "Use science-backed protocols to add 20+ healthy years to your life",
      category: "Health",
      difficulty: "intermediate",
      estimatedDuration: "9 weeks",
      tags: ["Biohacking", "Longevity", "Nutrition", "Sleep"],
      whyTrending: "Breakthroughs in NAD+, rapamycin, and wearables are going mainstream",
      hook: "Measure and improve your biological age in 90 days",
      questions: [
        { question: "Is this real science?", answer: "Yes — backed by Harvard, Stanford, and 1000+ studies" },
      ],
    },
  ];
}

export async function GET(request) {
  const { db } = await connectToDatabase();

  try {
    // === 1. Check Shared Cache (refreshes every Saturday midnight) ===
    const lastSaturday = getLatestSaturdayMidnight();
    const userId = "global_trending";

    const cached = await db.collection("explore_trending").findOne({
      userId,
      createdAt: { $gte: lastSaturday },
    });

    if (cached?.topics?.length >= 12) {
      return NextResponse.json({
        success: true,
        topics: cached.topics.slice(0, 12),
        source: "cache",
        refreshedAt: cached.createdAt,
      });
    }

    const result = await generateExploreTrending();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Trending topics critical failure:", error);

    // Nuclear fallback — always works
    return NextResponse.json({
      success: true,
      topics: getFallbackTopics(),
    });
  }
}
