import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CACHE_TTL_HOURS = 168; // 7 days

const CATEGORY_COLORS = [
  "blue", "purple", "orange", "green", "indigo", "pink", "red", "cyan",
  "teal", "yellow", "rose", "lime",
];

export async function generateCategories() {
  const { db } = await connectToDatabase();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are the world's best learning experience curator. Generate exactly 12 diverse course categories for an online learning platform.

Each category must include:
- name: A clear, catchy category name
- count: A realistic number of specializations (between 8 and 80)
- topics: An array of 5-8 specific topics within this category
- description: A short compelling description (under 50 words)

Ensure diversity across these pillars:
- Technology & Engineering
- Business & Entrepreneurship
- Health & Wellness
- Creative Arts & Design
- Humanities & Social Sciences
- Science & Mathematics
- Languages & Communication
- Personal Development & Lifestyle
- Education & Teaching
- Trades & Technical Skills

Return ONLY a JSON object with a "categories" array. No markdown. No extra text.`,
        },
        {
          role: "user",
          content: "Give me 12 diverse, well-structured course categories for an online learning platform. Make them feel fresh and cover a wide range of fields. Return ONLY a JSON object.",
        },
      ],
    });

    const raw = completion.choices[0].message.content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(raw);
    const cats = Array.isArray(parsed.categories) ? parsed.categories : Array.isArray(parsed) ? parsed : [];

    if (cats.length < 6) throw new Error("AI returned too few categories");

    const final = cats.slice(0, 12).map((cat, i) => ({
      name: cat.name || "Category",
      count: cat.count || Math.floor(Math.random() * 40) + 10,
      topics: Array.isArray(cat.topics) ? cat.topics.slice(0, 8) : [],
      description: cat.description || "",
      icon: "book",
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));

    // Cache in DB
    await db.collection("explore_categories").deleteMany({ key: "global" });
    await db.collection("explore_categories").insertOne({
      key: "global",
      categories: final,
      createdAt: new Date(),
    });

    return { success: true, categories: final, source: "ai-generated" };
  } catch (error) {
    console.error("Category generation error:", error);
    return { success: false, error: error.message, categories: [] };
  }
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000);

    const cached = await db.collection("explore_categories").findOne({
      key: "global",
      createdAt: { $gte: cutoff },
    });

    if (cached?.categories?.length >= 6) {
      return NextResponse.json({
        success: true,
        categories: cached.categories,
        source: "cache",
      });
    }

    const result = await generateCategories();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Categories API critical failure:", error);
    return NextResponse.json({ success: true, categories: [], source: "fallback" });
  }
}
