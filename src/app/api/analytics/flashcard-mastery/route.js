import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";

async function handleGet(request) {
  const user = request.user;
  const { db } = await connectToDatabase();

  const cardSets = await db
    .collection("cardSets")
    .find({ userId: user._id })
    .project({ cards: 1 })
    .toArray();

  let total = 0;
  let newCards = 0;
  let learning = 0;
  let young = 0;
  let mature = 0;

  for (const set of cardSets) {
    for (const card of set.cards || []) {
      total++;
      const interval = card.srs?.interval || 0;
      if (interval === 0) newCards++;
      else if (interval <= 6) learning++;
      else if (interval <= 30) young++;
      else mature++;
    }
  }

  const masteryRate = total > 0 ? Math.round((mature / total) * 100) : 0;

  return NextResponse.json({
    success: true,
    distribution: {
      new: newCards,
      learning,
      young,
      mature,
    },
    total,
    masteryRate,
  });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
