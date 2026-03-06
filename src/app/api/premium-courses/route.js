// src/app/api/premium-courses/route.js

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PersonalizedDiscovery from "@/models/PersonalizedDiscovery";
import { ObjectId } from "mongodb";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory cache (auto-refreshes every 5 minutes)
let cachedData = null;
let lastFetched = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Seed data — beautiful, production-grade courses
const PREMIUM_COURSES_SEED = [
  {
    title: "Complete Full-Stack Development Bootcamp 2025",
    slug: "fullstack-bootcamp-2025",
    description:
      "Master React, Node.js, TypeScript, Next.js, and deploy production apps",
    instructor: "Sarah Chen",
    avatar: "/instructors/sarah-chen.jpg",
    duration: "12 weeks",
    students: 18750,
    rating: 4.95,
    reviews: 3421,
    difficulty: "Intermediate",
    category: "Full-Stack",
    thumbnail: "/courses/fullstack-2025.jpg",
    highlights: [
      "Build 6 portfolio-ready apps (SaaS, AI tools, e-commerce)",
      "Master TypeScript, tRPC, Prisma, NextAuth",
      "Deploy to Vercel, AWS, Railway",
      "Lifetime updates + private Discord",
    ],
    outcomes: [
      "Land $120k+ remote dev jobs",
      "Build production-grade apps solo",
      "Contribute to open source confidently",
    ],
    price: 229,
    originalPrice: 599,
    featured: true,
    bestseller: true,
    tags: ["React", "Next.js", "TypeScript", "Node.js", "Prisma", "tRPC"],
    modules: 10,
    lessons: 68,
    projects: 6,
    certificate: true,
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date(),
  },
  {
    title: "AI Engineering Mastery",
    slug: "ai-engineering-2025",
    description:
      "Build and deploy production AI apps with LLMs, RAG, and agents",
    instructor: "Dr. Maya Patel",
    avatar: "/instructors/maya-patel.jpg",
    duration: "10 weeks",
    students: 12400,
    rating: 4.98,
    reviews: 2189,
    difficulty: "Advanced",
    category: "AI & ML",
    thumbnail: "/courses/ai-engineering.jpg",
    highlights: [
      "Fine-tune Llama 3 & Mistral",
      "Build RAG pipelines with Pinecone",
      "Create autonomous AI agents",
      "Deploy to production with monitoring",
    ],
    price: 399,
    originalPrice: 799,
    featured: false,
    bestseller: true,
    tags: ["Python", "LangChain", "LlamaIndex", "FastAPI", "Docker"],
    modules: 9,
    lessons: 52,
    projects: 4,
    certificate: true,
    createdAt: new Date("2025-02-20"),
    updatedAt: new Date(),
  },
  {
    title: "The Ultimate System Design Interview",
    slug: "system-design-masterclass",
    description: "Ace FAANG interviews with real-world system design patterns",
    instructor: "Alex Kim",
    avatar: "/instructors/alex-kim.jpg",
    duration: "8 weeks",
    students: 9800,
    rating: 4.93,
    reviews: 1890,
    difficulty: "Advanced",
    category: "Career",
    thumbnail: "/courses/system-design.jpg",
    highlights: [
      "Solve 50+ real interview questions",
      "Design Netflix, Uber, WhatsApp, TikTok",
      "Rate limiting, caching, sharding, queues",
      "Whiteboard + code solutions",
    ],
    price: 179,
    originalPrice: 399,
    featured: false,
    bestseller: false,
    tags: ["System Design", "Scalability", "Distributed Systems", "Interview"],
    modules: 7,
    lessons: 42,
    projects: 12,
    certificate: true,
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date(),
  },
];

// Auto-seed only once in production
async function ensureCourses(db) {
  const col = db.collection("premium_courses");
  const count = await col.countDocuments();

  if (count === 0) {
    console.log("Seeding premium courses...");
    await col.insertMany(
      PREMIUM_COURSES_SEED.map((course) => ({
        ...course,
        _id: new ObjectId(),
      }))
    );
    console.log("Premium courses seeded successfully");
  }
}

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();

    // 1. Check for Authentication
    let userId = null;
    let userInterests = [];
    let userGoals = [];
    let recentCourses = [];

    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = await import("@/lib/auth").then(m => m.verifyToken(token));

        if (decoded?.id) {
          userId = new ObjectId(decoded.id);
          const user = await db.collection("users").findOne(
            { _id: userId },
            { projection: { interests: 1, interestCategories: 1, goals: 1 } }
          );

          if (user) {
            const cats = user.interestCategories || [];
            const ints = user.interests || [];
            userInterests = [...new Set([...cats, ...ints])].map(i => i.toLowerCase());
            userGoals = user.goals || [];

            const courses = await db.collection("library")
              .find({ userId, format: "course" })
              .sort({ createdAt: -1 })
              .limit(5)
              .project({ title: 1 })
              .toArray();
            recentCourses = courses.map(c => c.title);
          }
        }
      } catch (e) {
        console.warn("Premium courses personalisation: Auth failed", e.message);
      }
    }

    // 2. Return cached personalized discovery if available and fresh
    if (userId) {
      try {
        const cached = await PersonalizedDiscovery.findOne({
          userId,
          type: "premium_courses",
          expiresAt: { $gt: new Date() }
        });

        if (cached) {
          return NextResponse.json(cached.content);
        }
      } catch (err) {
        console.error("PersonalizedDiscovery fetch error:", err);
      }
    }

    // 3. Generate Personalized Premium Courses
    let finalResult = null;

    if (userId && (userInterests.length > 0 || recentCourses.length > 0)) {
      const systemPrompt = `You are a high-end educational curator. Generate 3-5 premium, "Masterclass" style course recommendations for a learner.
        
USER CONTEXT:
- Interests: ${userInterests.join(", ")}
- Goals: ${userGoals.join(", ")}
- Previous Courses: ${recentCourses.join(", ")}

Think of these as "Elite" or "Pro" level courses that provide deep industry value.

JSON Structure:
{
  "featured": {
    "title": "Main Featured Course Name",
    "slug": "course-slug",
    "description": "Deep description",
    "instructor": "World-class name",
    "avatar": "URL",
    "duration": "e.g. 10 weeks",
    "students": number,
    "rating": number (4.8-5.0),
    "reviews": number,
    "difficulty": "Advanced|Intermediate",
    "category": "Category",
    "thumbnail": "URL",
    "highlights": ["Highly specific outcome 1", "Outcome 2"],
    "outcomes": ["Career shift 1", "Skill mastery 2"],
    "price": number,
    "originalPrice": number,
    "featured": true,
    "bestseller": true,
    "tags": ["tag1", "tag2"],
    "modules": number,
    "lessons": number,
    "projects": number,
    "certificate": true
  },
  "courses": [
    // Array of 2-4 more elite courses matching the same structure but featured: false
  ]
}`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [{ role: "system", content: systemPrompt }]
        });

        const generated = JSON.parse(completion.choices[0].message.content);
        const processedResult = {
          featured: generated.featured,
          courses: generated.courses || [],
          total: (generated.courses?.length || 0) + (generated.featured ? 1 : 0),
          updatedAt: new Date().toISOString(),
          personalized: true
        };

        // Cache the result for 30 days
        await PersonalizedDiscovery.updateOne(
          { userId, type: "premium_courses" },
          {
            $set: {
              content: processedResult,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          },
          { upsert: true }
        );

        finalResult = processedResult;
      } catch (aiErr) {
        console.error("AI Premium Gen failed:", aiErr);
      }
    }

    // 4. Fallback to static seed data if guest or AI failed
    if (!finalResult) {
      // Use static seed if already in DB
      const col = db.collection("premium_courses");
      await ensureCourses(db);

      const [f, others] = await Promise.all([
        col.findOne({ featured: true }),
        col
          .find({ featured: { $ne: true } })
          .sort({ students: -1, rating: -1 })
          .toArray(),
      ]);

      finalResult = {
        featured: f,
        courses: others,
        total: others.length + (f ? 1 : 0),
        updatedAt: new Date().toISOString(),
        personalized: false
      };
    }

    return NextResponse.json(finalResult);
  } catch (error) {
    console.error("Premium courses API error:", error);
    return NextResponse.json(
      { error: "Failed to load premium courses" },
      { status: 500 }
    );
  }
}
