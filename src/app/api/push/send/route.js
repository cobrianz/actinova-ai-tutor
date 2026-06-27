import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { title, body, url } = await request.json();
    if (!title || !body) {
      return NextResponse.json({ error: "title and body required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const subs = await db.collection("pushSubscriptions").find({
      userId: new ObjectId(userId),
    }).toArray();

    if (subs.length === 0) {
      return NextResponse.json({ error: "No subscriptions found" }, { status: 404 });
    }

    const payload = JSON.stringify({ title, body, url: url || "/dashboard" });
    const results = [];

    for (const sub of subs) {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        results.push({ endpoint: sub.subscription.endpoint, status: "sent" });
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.collection("pushSubscriptions").deleteOne({ _id: sub._id });
          results.push({ endpoint: sub.subscription.endpoint, status: "expired" });
        } else {
          results.push({ endpoint: sub.subscription.endpoint, status: "error", error: err.message });
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Push send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
