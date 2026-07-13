export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
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

async function handleGet(request) {
  const user = request.user;
  const { db } = await connectToDatabase();

  const aggregated = await db
    .collection("library")
    .aggregate([
      { $match: { format: "study_plan" } },
      {
        $group: {
          _id: "$userId",
          completedTasks: { $sum: { $ifNull: ["$completedTasks", 0] } },
          totalPlans: { $sum: 1 },
        },
      },
    ])
    .toArray();

  aggregated.sort((a, b) => b.completedTasks - a.completedTasks);

  const leaderboard = aggregated.slice(0, 20);
  const topUserIds = leaderboard.map((e) => e._id);

  const users = await db
    .collection("users")
    .find(
      { _id: { $in: topUserIds } },
      {
        projection: {
          firstName: 1,
          lastName: 1,
          name: 1,
          email: 1,
          level: 1,
        },
      }
    )
    .toArray();

  const userMap = {};
  for (const u of users) {
    userMap[u._id.toString()] = u;
  }

  const formattedLeaderboard = leaderboard.map((entry, index) => {
    const u = userMap[entry._id.toString()];
    return {
      rank: index + 1,
      name: u ? getDisplayName(u) : "Anonymous",
      completedTasks: entry.completedTasks,
      totalPlans: entry.totalPlans,
      level: u?.level || 1,
      isCurrentUser: entry._id.toString() === user._id.toString(),
    };
  });

  const currentUserId = user._id.toString();
  const currentUserIdx = aggregated.findIndex(
    (e) => e._id.toString() === currentUserId
  );
  const currentUserRank = currentUserIdx >= 0 ? currentUserIdx + 1 : aggregated.length + 1;

  return NextResponse.json({
    success: true,
    leaderboard: formattedLeaderboard,
    currentUserRank,
  });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
