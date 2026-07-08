import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

let webpush = null;
function getWebpush() {
  if (webpush) return webpush;
  webpush = require("web-push");
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (subject && publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  }
  return webpush;
}

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

    const wp = getWebpush();
    if (!wp) {
      return NextResponse.json({ error: "Push notifications not configured" }, { status: 501 });
    }

    const payload = JSON.stringify({ title, body, url: url || "/dashboard" });
    const results = [];

    for (const sub of subs) {
      try {
        await wp.sendNotification(sub.subscription, payload);
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
