import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth } from "@/lib/middleware";
import { ObjectId } from "mongodb";

async function handlePost(request) {
  try {
    const { db } = await connectToDatabase();
    const user = request.user;

    await db.collection("users").updateOne(
      { _id: new ObjectId(user._id) },
      {
        $set: {
          "subscription.status": "cancelled",
          "subscription.cancelledAt": new Date(),
          "subscription.updatedAt": new Date(),
        },
      }
    );

    return NextResponse.json({ 
      success: true, 
      message: "Subscription cancelled successfully. You will retain access until the end of your billing period." 
    });
  } catch (error) {
    console.error("Cancellation Error:", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}

export const POST = withAuth(handlePost);
