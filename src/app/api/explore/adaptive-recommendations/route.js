import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { buildAdaptiveInsights } from "@/lib/adaptiveInsights";
import PersonalizedDiscovery from "@/models/PersonalizedDiscovery";
import { ObjectId } from "mongodb";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const CACHE_TTL_DAYS = 7;

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();

    let userId = null;

    // Try Authorization header first, then cookie
    const authHeader = request.headers.get("authorization");
    let token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      token = (await cookies()).get("token")?.value;
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded?.id) userId = new ObjectId(decoded.id);
      } catch {}
    }

    if (!userId) {
      return NextResponse.json({ success: true, recommendations: [], personalized: false });
    }

    // Check cache (skip if stale or empty to force refresh)
    try {
      const cached = await PersonalizedDiscovery.findOne({
        userId,
        type: "adaptive_recommendations",
        expiresAt: { $gt: new Date() },
      });
      if (cached?.content?.length > 0) {
        return NextResponse.json({ success: true, personalized: true, recommendations: cached.content, source: "cache" });
      }
    } catch {}

    // Fetch user profile
    const user = await db.collection("users").findOne(
      { _id: userId },
      {
        projection: {
          interests: 1, interestCategories: 1, goals: 1, skillLevel: 1,
          learningStyle: 1, ageGroup: 1, timeCommitment: 1, courses: 1,
        },
      }
    );

    if (!user) {
      return NextResponse.json({ success: true, recommendations: [], personalized: false });
    }

    const cats = user.interestCategories || [];
    const ints = user.interests || [];
    const userInterests = [...new Set([...cats, ...ints])].map((i) => i.toLowerCase());
    const userGoals = user.goals || [];
    const userSkillLevel = user.skillLevel || "beginner";
    const userLearningStyle = user.learningStyle || "";
    const userAgeGroup = user.ageGroup || "";
    const userTimeCommitment = user.timeCommitment || "";

    // Build course progress from user.courses
    const enrolledCourses = user.courses || [];
    const courseProgress = enrolledCourses.slice(0, 20).map((c) => ({
      title: c.title || "Untitled course",
      progress: typeof c.progress === "number" ? c.progress : 0,
      format: c.format || "course",
    }));

    // Fetch quiz data
    const quizzes = await db
      .collection("tests")
      .find({}, { projection: { performances: 1, title: 1 } })
      .toArray()
      .catch(() => []);

    const quizTrends = [];
    for (const quiz of quizzes) {
      for (const perf of quiz.performances || []) {
        if (perf.userId?.toString() === userId.toString()) {
          quizTrends.push({
            score: typeof perf.score === "number" ? perf.score : 0,
            date: perf.completedAt || perf.date,
            title: quiz.title,
          });
        }
      }
    }
    quizTrends.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    // Fetch flashcard stats
    const cardSets = await db
      .collection("cardSets")
      .find({ $or: [{ userId }, { userId: userId.toString() }] }, { projection: { cards: 1 } })
      .toArray()
      .catch(() => []);

    let totalFlashcards = 0;
    let masteredFlashcards = 0;
    for (const set of cardSets) {
      for (const card of set.cards || []) {
        totalFlashcards++;
        if (card.mastery >= 4 || card.mastered) masteredFlashcards++;
      }
    }

    // Build adaptive insights
    const adaptiveInsights = buildAdaptiveInsights({
      summary: {
        averageQuizScore:
          quizTrends.length > 0
            ? Math.round(quizTrends.reduce((s, q) => s + q.score, 0) / quizTrends.length)
            : 0,
        masteredFlashcards,
        totalFlashcards,
      },
      courseProgress,
      quizTrends,
      user: { goals: userGoals },
    });

    // Fetch ALL enrolled course titles to exclude from recommendations
    const allCourses = await db
      .collection("library")
      .find({ userId, format: "course" })
      .project({ title: 1 })
      .toArray()
      .catch(() => []);

    const allCourseTitles = allCourses.map((c) => c.title);
    const recentTitles = allCourseTitles.slice(0, 10);

    // Also fetch enrolled courses from user document
    const enrolledTitles = (user.courses || []).map((c) => c.title).filter(Boolean);
    const existingTitles = [...new Set([...allCourseTitles, ...enrolledTitles])];

    // Build a summary of what the user is learning and how they're doing
    const courseSummary = courseProgress
      .map((c) => `"${c.title}" — ${c.progress}% complete`)
      .join("\n");

    // Generate AI recommendations based on adaptive profile
    const systemPrompt = `You are an adaptive learning engine. Generate exactly 8 UNIQUE, highly specific course recommendations for this EXACT learner. Every recommendation must feel personally hand-picked for THIS person — no generic filler.

THIS LEARNER'S PROFILE:
- Interests: ${userInterests.join(", ") || "General"}
- Goals: ${userGoals.join(", ") || "Improve skills"}
- Skill Level: ${userSkillLevel}
- Learning Style: ${userLearningStyle || "Any"}
- Time Commitment: ${userTimeCommitment || "Flexible"}

THEIR ACTUAL LEARNING DATA:
- Mastery Score: ${adaptiveInsights.overallMasteryScore}%
- Avg Course Progress: ${adaptiveInsights.avgCourseProgress}%
- Quiz Score: ${adaptiveInsights.recentQuizScore}%
- Flashcard Mastery: ${adaptiveInsights.flashcardMastery}%

COURSES THEY ARE CURRENTLY TAKING AND HOW FAR THEY ARE:
${courseSummary || "No courses in progress"}

WEAK AREAS IDENTIFIED:
${adaptiveInsights.focusAreas.map((f) => `- "${f.title}" at ${f.progress}% (${f.priority} priority)`).join("\n") || "No weak areas identified"}

COURSES THEY ALREADY HAVE (DO NOT RECOMMEND THESE OR ANY SIMILAR TOPIC):
${existingTitles.join(", ") || "None"}

CRITICAL RULES:
1. NEVER recommend any course listed above — not even a renamed version.
2. Each of the 8 courses MUST be from a DIFFERENT category from each other.
3. The "reason" field MUST reference something SPECIFIC from their data — their actual course titles, their exact mastery score, their specific weak areas, their actual goals. Never use vague language like "based on your profile" or "strengthens your skills". Instead say exactly: "Your Python course is at 45% — this fills the gap in advanced data structures you haven't covered yet."
4. The "description" field MUST explain what they will concretely learn and why it matters to THEM specifically. Reference their goals or weak areas directly.
5. Vary the difficulty across the 8 recommendations — not all the same level.
6. Each recommendation should serve a DIFFERENT purpose: one fills a knowledge gap, one extends a strength, one explores a new interest aligned with their goals, one builds on a weak area, etc.

JSON Structure:
{
  "courses": [
    {
      "title": "Course Name",
      "description": "What they will learn and why it matters to THIS learner specifically (2-3 sentences, referencing their actual data)",
      "category": "Technology|Business|Arts|etc",
      "difficulty": "Beginner|Intermediate|Advanced",
      "duration": "e.g. 4 weeks",
      "reason": "Specific reason tied to their actual learning data — reference their course titles, scores, or weak areas by name (1 sentence)",
      "tags": ["tag1", "tag2"],
      "rating": number (4.0-5.0),
      "students": number,
      "isPremium": boolean
    }
  ]
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: systemPrompt }],
      });

      const generated = JSON.parse(completion.choices[0].message.content);
      const existingLower = existingTitles.map((t) => t.toLowerCase());
      const recommendations = (generated.courses || [])
        .filter((c) => {
          const title = (c.title || "").toLowerCase();
          return !existingLower.some((et) => title.includes(et) || et.includes(title) || title === et);
        })
        .map((c) => ({
          title: c.title,
          description: c.description || "",
          category: c.category || "General",
          difficulty: c.difficulty || "Beginner",
          duration: c.duration || "4 weeks",
          reason: c.reason || "",
          tags: c.tags || [],
          rating: c.rating || 4.5,
          students: c.students || 0,
          isPremium: c.isPremium || false,
        }));

      // Cache for 7 days
      await PersonalizedDiscovery.updateOne(
        { userId, type: "adaptive_recommendations" },
        {
          $set: {
            content: recommendations,
            expiresAt: new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000),
          },
        },
        { upsert: true }
      );

      return NextResponse.json({
        success: true,
        personalized: true,
        recommendations,
        adaptiveProfile: {
          masteryScore: adaptiveInsights.overallMasteryScore,
          focusAreas: adaptiveInsights.focusAreas,
        },
      });
    } catch (aiErr) {
      console.error("Adaptive recommendations AI generation failed:", aiErr);
      return NextResponse.json({ success: true, recommendations: [], personalized: true });
    }
  } catch (error) {
    console.error("Adaptive recommendations API failed:", error);
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
