
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import PersonalizedDiscovery from "@/models/PersonalizedDiscovery";
import { ObjectId } from "mongodb";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



// === GET /api/explore ===
// Returns personalized trending topics if user is logged in
export async function GET(request) {
  try {
    const { db } = await connectToDatabase();

      // 1. Check for Authentication
    let userId = null;
    let userInterests = [];
    let userGoals = [];
    let recentCourses = [];
    let userSkillLevel = "beginner";
    let userLearningStyle = "";
    let userAgeGroup = "";
    let userTimeCommitment = "";

    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = await import("@/lib/auth").then(m => m.verifyToken(token));

        if (decoded?.id) {
          userId = new ObjectId(decoded.id);
          const user = await db.collection("users").findOne(
            { _id: userId },
            {
              projection: {
                interests: 1,
                interestCategories: 1,
                goals: 1,
                skillLevel: 1,
                learningStyle: 1,
                ageGroup: 1,
                timeCommitment: 1
              }
            }
          );

          if (user) {
            const cats = user.interestCategories || [];
            const ints = user.interests || [];
            userInterests = [...new Set([...cats, ...ints])].map(i => i.toLowerCase());
            userGoals = user.goals || [];
            userSkillLevel = user.skillLevel || "beginner";
            userLearningStyle = user.learningStyle || "";
            userAgeGroup = user.ageGroup || "";
            userTimeCommitment = user.timeCommitment || "";

            // Fetch recently generated courses for better context
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
        console.warn("Explore personalisation: Auth failed", e.message);
      }
    }

    // 2. Return cached personalized discovery if available and fresh
    if (userId) {
      try {
        const cached = await PersonalizedDiscovery.findOne({
          userId,
          type: "explore_trending",
          expiresAt: { $gt: new Date() }
        });

        if (cached) {
          return NextResponse.json({
            success: true,
            personalized: true,
            trendingTopics: cached.content,
            source: "cache"
          });
        }
      } catch (err) {
        console.error("PersonalizedDiscovery fetch error:", err);
      }
    }

    // 3. Generate Personalized or Fetch Generic Topics
    let topics = [];

    if (userId && (userInterests.length > 0 || recentCourses.length > 0)) {
      // AI Generation for high personalization
      const systemPrompt = `You are an educational consultant. Generate 6 trending and highly relevant course recommendations for a learner.
        
USER CONTEXT:
- Interests: ${userInterests.join(", ") || "General"}
- Goals: ${userGoals.join(", ") || "Improve skills"}
- Skill Level: ${userSkillLevel}
- Learning Style: ${userLearningStyle || "Any"}
- Age Group: ${userAgeGroup || "Adult"}
- Time Commitment: ${userTimeCommitment || "Flexible"}
- Recently Studied: ${recentCourses.join(", ") || "None"}

Provide courses that are currently trending in 2025 and match this user profile exactly. Prioritize courses that align with the user's skill level and learning style.

JSON Structure:
{
  "courses": [
    {
      "title": "Course Name",
      "students": number,
      "rating": number (4.0-5.0),
      "duration": "e.g. 4 weeks",
      "level": "Beginner|Intermediate|Advanced",
      "category": "Technology|Business|Arts|etc",
      "instructor": "Name",
      "thumbnail": "URL",
      "description": "Short catchy description",
      "tags": ["tag1", "tag2"],
      "price": number,
      "isPremium": boolean
    }
  ]
}`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.8,
          response_format: { type: "json_object" },
          messages: [{ role: "system", content: systemPrompt }]
        });

        const generated = JSON.parse(completion.choices[0].message.content);
        topics = generated.courses || [];

        // Cache the result for 30 days
        await PersonalizedDiscovery.updateOne(
          { userId, type: "explore_trending" },
          {
            $set: {
              content: topics,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          },
          { upsert: true }
        );
      } catch (aiErr) {
        console.error("AI Explore Gen failed:", aiErr);
        // Fallback to static trending if AI fails
      }
    }

    // 4. Fallback: If no topics generated (guest or error), fetch from explore_trending collection
    if (topics.length === 0) {
      const trendingCol = db.collection("explore_trending");
      topics = await trendingCol.find({})
        .sort({ students: -1, rating: -1 })
        .limit(6)
        .toArray();
    }

    // 5. Clean output
    const cleanTopics = topics.map((t) => ({
      title: t.title,
      students: t.students || 0,
      rating: t.rating || 5.0,
      duration: t.duration || "4 weeks",
      level: t.level || "Beginner",
      category: t.category || "General",
      instructor: t.instructor || "Actirova Expert",
      thumbnail: t.thumbnail || "",
      description: t.description || "",
      tags: t.tags || [],
      price: t.price || 0,
      isPremium: t.isPremium || false,
    }));

    return NextResponse.json({
      success: true,
      personalized: !!userId,
      trendingTopics: cleanTopics,
    });
  } catch (error) {
    console.error("Explore API failed:", error);
    return NextResponse.json(
      { error: "Failed to load trending courses" },
      { status: 500 }
    );
  }
}
