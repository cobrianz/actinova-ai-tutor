export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { PRODUCTS, hasItem } from "@/lib/planLimits";

async function handlePost(request) {
  const user = request.user;

  try {
    const body = await request.json();
    const { itemType } = body;

    if (!itemType) {
      return NextResponse.json({ error: "itemType is required" }, { status: 400 });
    }

    const product = PRODUCTS.find((p) => p.id === itemType);
    if (!product) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Re-fetch user for fresh credit count
    const freshUser = await db.collection("users").findOne(
      { _id: new ObjectId(user._id) },
      { projection: { credits: 1, purchasedItems: 1 } }
    );

    if (!freshUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user already purchased this item outright, no credits needed
    if (hasItem(freshUser, itemType)) {
      return NextResponse.json({ success: true, credits: freshUser.credits || 0 });
    }

    const currentCredits = freshUser.credits || 0;
    if (currentCredits < product.creditCost) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: product.creditCost,
          available: currentCredits,
        },
        { status: 402 }
      );
    }

    // Deduct credits
    await db.collection("users").updateOne(
      { _id: new ObjectId(user._id) },
      {
        $inc: { credits: -product.creditCost },
        $push: {
          billingHistory: {
            type: "credit_usage",
            itemType,
            creditsSpent: product.creditCost,
            createdAt: new Date(),
          },
        },
      }
    );

    return NextResponse.json({
      success: true,
      credits: currentCredits - product.creditCost,
    });
  } catch (error) {
    console.error("Use credits error:", error);
    throw error;
  }
}

export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
