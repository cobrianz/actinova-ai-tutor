
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import { ObjectId } from "mongodb";



// === GET /api/explore ===
// Returns personalized trending topics if user is logged in
export async function GET(request) {
  try {
    const { db } = await connectToDatabase();

    const trendingCol = db.collection("explore_trending");

    // 1. Check for Authentication
    let userInterests = [];
    const authHeader = request.headers.get("authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);

        if (decoded?.id) {
          // Fetch user details
          // Note: We need to use findOne on the collection directly or use the model
          // Using direct collection for speed and to avoid model initialization race conditions if any
          const user = await db.collection("users").findOne(
            { _id: new ObjectId(decoded.id) },
            { projection: { interests: 1, interestCategories: 1 } }
          );

          if (user) {
            const cats = user.interestCategories || [];
            const ints = user.interests || [];
            userInterests = [...new Set([...cats, ...ints])].map(i => i.toLowerCase());
          }
        }
      } catch (e) {
        // Invalid token - treat as guest
        console.warn("Explore personalisation: Invalid token", e.message);
      }
    }

    let results = [];

    // 2. Personalization Query
    if (userInterests.length > 0) {
      // Create a regex array for flexible matching
      const regexConditions = userInterests.map(interest => ({
        $or: [
          { category: { $regex: interest, $options: "i" } },
          { tags: { $in: [new RegExp(interest, "i")] } },
          { title: { $regex: interest, $options: "i" } }
        ]
      }));

      // Find courses matching ANY interest
      const personalizedCourses = await trendingCol.find({
        $or: regexConditions
      })
        .sort({ students: -1, rating: -1 })
        .limit(6)
        .toArray();

      results = personalizedCourses;
    }

    // 3. Fallback / Fill up to 6 items
    if (results.length < 6) {
      const existingIds = results.map(r => r._id);

      const genericTrending = await trendingCol.find({
        _id: { $nin: existingIds }
      })
        .sort({ students: -1 })
        .limit(6 - results.length)
        .toArray();

      results = [...results, ...genericTrending];
    }

    // 4. Clean output
    const cleanTopics = results.map((t) => ({
      title: t.title,
      students: t.students,
      rating: t.rating,
      duration: t.duration,
      level: t.level,
      category: t.category,
      instructor: t.instructor,
      thumbnail: t.thumbnail,
      description: t.description,
      tags: t.tags,
      price: t.price,
      isPremium: t.isPremium,
    }));

    return NextResponse.json({
      success: true,
      personalized: userInterests.length > 0,
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
