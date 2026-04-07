import crypto from "crypto";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import {
  grantMarketplaceCourseAccess,
  savePremiumGenerationIntent,
} from "@/lib/courseCommerce";

export const dynamic = "force-dynamic";

function verifySignature(body, signature) {
  if (!process.env.PAYSTACK_SECRET_KEY || !signature) {
    return false;
  }

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(body)
    .digest("hex");

  return hash === signature;
}

async function appendBillingIfNeeded({ db, userId, data, metadata }) {
  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
  const alreadyProcessed = Array.isArray(user?.billingHistory)
    ? user.billingHistory.some((entry) => entry.reference === data.reference)
    : false;

  if (alreadyProcessed) {
    return false;
  }

  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    {
      $push: {
        billingHistory: {
          type: metadata.purchaseType === "subscription" ? "subscription" : "one-time",
          plan: metadata.plan || metadata.purchaseType || "subscription",
          billingCycle: metadata.billingCycle || "monthly",
          amount: data.amount / 100,
          currency: data.currency,
          reference: data.reference,
          transactionId: data.id,
          status: "success",
          paymentMethod: data.channel,
          gateway: "paystack",
          paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
          description:
            metadata.purchaseType === "marketplace-course"
              ? `Marketplace course unlock: ${metadata.courseTitle || metadata.courseId}`
              : metadata.purchaseType === "premium-generation"
                ? `Premium course generation: ${metadata.topic}`
                : metadata.purchaseType === "resume-export"
                  ? `Resume export: ${metadata.resumeTitle || metadata.historyId}`
                  : `Subscription: ${metadata.plan || "pro"}`,
          metadata,
        },
      },
    }
  );

  return true;
}

async function markResumeExportPaid({ db, userId, historyId, reference, amount, currency }) {
  if (!historyId || !ObjectId.isValid(historyId)) {
    throw new Error("Invalid resume history id");
  }

  const now = new Date();
  const result = await db.collection("careerhistories").findOneAndUpdate(
    {
      _id: new ObjectId(historyId),
      userId: new ObjectId(userId),
      type: "resume",
    },
    {
      $set: {
        "metadata.exportPaid": true,
        "metadata.exportPaidAt": now,
        "metadata.exportReference": reference,
        "metadata.exportAmount": amount,
        "metadata.exportCurrency": currency,
      },
    },
    { returnDocument: "after" }
  );

  if (!result) {
    throw new Error("Resume not found for export payment");
  }
}

async function applyPurchase({ db, userId, data, metadata }) {
  const purchaseType = metadata.purchaseType || "subscription";

  if (purchaseType === "marketplace-course") {
    await grantMarketplaceCourseAccess({
      db,
      userId,
      courseId: metadata.courseId,
      reference: data.reference,
      amount: data.amount / 100,
      currency: data.currency,
    });
    return;
  }

  if (purchaseType === "premium-generation") {
    await savePremiumGenerationIntent({
      db,
      userId,
      topic: metadata.topic,
      difficulty: metadata.difficulty || "beginner",
      reference: data.reference,
      amount: data.amount / 100,
      currency: data.currency,
    });
    return;
  }

  if (purchaseType === "resume-export") {
    await markResumeExportPaid({
      db,
      userId,
      historyId: metadata.historyId,
      reference: data.reference,
      amount: data.amount / 100,
      currency: data.currency,
    });
    return;
  }

  const now = new Date();
  const expiresAt = new Date(now);
  if ((metadata.billingCycle || "monthly") === "yearly") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        isPremium: true,
        "subscription.plan": metadata.plan || "pro",
        "subscription.tier":
          String(metadata.plan || "pro").toLowerCase().includes("enterprise")
            ? "enterprise"
            : "pro",
        "subscription.status": "active",
        "subscription.billingCycle": metadata.billingCycle || "monthly",
        "subscription.currentPeriodStart": now,
        "subscription.currentPeriodEnd": expiresAt,
        "subscription.lastPaymentDate": now,
        "subscription.paystackCustomerCode": data.customer?.customer_code,
        "subscription.paystackReference": data.reference,
      },
    }
  );
}

export async function POST(request) {
  const bodyRaw = await request.text();
  const headersList = await headers();
  const signature = headersList.get("x-paystack-signature");

  if (!verifySignature(bodyRaw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(bodyRaw);
  } catch (error) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event?.event !== "charge.success" || !event?.data?.metadata?.userId) {
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    const { db } = await connectToDatabase();
    const metadata = event.data.metadata || {};
    const userId = metadata.userId;

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    const isNew = await appendBillingIfNeeded({
      db,
      userId,
      data: event.data,
      metadata,
    });

    if (isNew) {
      await applyPurchase({
        db,
        userId,
        data: event.data,
        metadata,
      });
    }

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error("Webhook handler crashed:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    webhook: "paystack",
    timestamp: new Date().toISOString(),
  });
}
