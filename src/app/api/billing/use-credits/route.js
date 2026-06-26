import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withErrorHandling, withAuth, combineMiddleware } from "@/lib/middleware";
import { PRODUCTS } from "@/lib/planLimits";

async function handlePost(request) {
  const user = request.user;
  const body = await request.json();
  const itemType = String(body.itemType || "").trim();

  const product = PRODUCTS.find((p) => p.id === itemType);
  if (!product || !product.creditCost) {
    return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
  }

  if (user.isPremium || user.purchasedItems?.some((p) => p.itemType === itemType)) {
    return NextResponse.json({ error: "Already purchased" }, { status: 400 });
  }

  if (!user.credits || user.credits < product.creditCost) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  const { db } = await connectToDatabase();

  const result = await db.collection("users").findOneAndUpdate(
    { _id: user._id, credits: { $gte: product.creditCost } },
    { $inc: { credits: -product.creditCost } },
    { returnDocument: "after" }
  );

  if (!result) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  return NextResponse.json({ success: true, credits: result.credits || 0 });
}

export const POST = combineMiddleware(
  withErrorHandling,
  withAuth
)(handlePost);
