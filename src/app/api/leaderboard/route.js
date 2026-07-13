import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

function getDisplayName(user) {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) return user.firstName;
  if (user.name) return user.name;
  if (user.email) return user.email.split("@")[0];
  return "Anonymous";
}

function getStreakCurrent(streak) {
  if (!streak) return 0;
  if (typeof streak === "number") return streak;
  return streak.current || 0;
}

async function handleGet(request) {
  const user = request.user;
  const { db } = await connectToDatabase();

  // Get top 50 users by XP
  const leaderboard = await db
    .collection("users")
    .find(
      { status: "active" },
      {
        projection: {
          firstName: 1,
          lastName: 1,
          name: 1,
          email: 1,
          xp: 1,
          level: 1,
          streak: 1,
          achievements: 1,
        },
      }
    )
    .sort({ xp: -1 })
    .limit(50)
    .toArray();

  // Find current user's rank
  const userRank = await db
    .collection("users")
    .countDocuments({ xp: { $gt: user.xp || 0 }, status: "active" });

  const formattedLeaderboard = leaderboard.map((entry, index) => ({
    rank: index + 1,
    name: getDisplayName(entry),
    xp: entry.xp || 0,
    level: entry.level || 1,
    streak: getStreakCurrent(entry.streak),
    badgeCount: entry.achievements?.length || 0,
    isCurrentUser: entry._id.toString() === user._id.toString(),
  }));

  return NextResponse.json({
    success: true,
    leaderboard: formattedLeaderboard,
    myRank: userRank + 1,
    myXp: user.xp || 0,
    myLevel: user.level || 1,
  });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
