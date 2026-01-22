import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth } from "@/lib/middleware";
import { ObjectId } from "mongodb";

async function handlePost(request) {
  try {
    const { db } = await connectToDatabase();
    const user = request.user;
    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    // Validate plan exists
    const plan = await db.collection("plans").findOne({ _id: new ObjectId(planId) });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Update subscription
    const expiryDate = new Date();
    if (plan.billingCycle === "monthly") {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (plan.billingCycle === "annual") {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    await db.collection("users").updateOne(
      { _id: new ObjectId(user._id) },
      {
        $set: {
          "subscription.tier": plan.tier,
          "subscription.status": "active",
          "subscription.expiryDate": expiryDate,
          "subscription.renewalReminderSent": false,
          "subscription.updatedAt": new Date(),
        },
      }
    );

    return NextResponse.json({ 
      success: true, 
      message: `Plan ${plan.name} renewed successfully`,
      expiryDate 
    });
  } catch (error) {
    console.error("Renewal Error:", error);
    return NextResponse.json({ error: "Failed to renew plan" }, { status: 500 });
  }
}

export const POST = withAuth(handlePost);
