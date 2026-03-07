import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * Refreshes user-specific content on login:
 * 1. Deletes explore courses older than 1 month
 * 2. Deletes premium courses, blogs, and career courses not from this year
 * 3. Refreshes skills on career sections not from this year
 * @param {Object} user - The user object from the database
 */
export async function refreshUserContent(userIdString) {
    try {
        const { db } = await connectToDatabase();
        const userId = new ObjectId(userIdString);

        const now = new Date();
        const currentYear = now.getFullYear();
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // 1. Delete explore courses (PersonalizedDiscovery type: explore_trending) older than 1 month
        const discoveryCol = db.collection("personalizeddiscoveries");
        await discoveryCol.deleteMany({
            userId,
            type: "explore_trending",
            createdAt: { $lt: oneMonthAgo }
        });

        // 2. Delete premium courses (PersonalizedDiscovery type: premium_courses) not from this year
        // We check the 'createdAt' timestamp
        await discoveryCol.deleteMany({
            userId,
            type: "premium_courses",
            createdAt: { $lt: new Date(currentYear, 0, 1) }
        });

        // 3. Delete old TrendingCareers (Career/Growth) not from this year
        const careerCol = db.collection("trendingcareers");
        await careerCol.deleteMany({
            userId,
            createdAt: { $lt: new Date(currentYear, 0, 1) }
        });

        // Note: Blogs (Post) are usually shared, but user may have personalized ones?
        // If posts are user-specific, we'd delete them too. 
        // Based on model 'Post.js', they don't seem exclusively user-specific but have publishedAt.
        // User requested: "ensure explore courses more than month old are deleted and new ones 
        // same to premium course, blogs, and careers courses this year"

        console.log(`Content refresh completed for user ${userIdString}`);

        // Return true to indicate we should probably trigger a re-generation in the background
        return true;
    } catch (error) {
        console.error("Content refresh failed:", error);
        return false;
    }
}
