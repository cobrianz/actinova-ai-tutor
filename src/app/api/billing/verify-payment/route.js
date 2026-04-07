import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import {
  grantMarketplaceCourseAccess,
  savePremiumGenerationIntent,
} from "@/lib/courseCommerce";

function redirectTo(request, path) {
  return NextResponse.redirect(new URL(path, request.url));
}

function getSuccessRedirect(metadata, reference) {
  const purchaseType = metadata.purchaseType || "subscription";

  if (purchaseType === "marketplace-course") {
    return `/dashboard?tab=premium-courses&payment=success&purchaseType=marketplace-course&courseId=${encodeURIComponent(
      metadata.courseId || ""
    )}&ref=${encodeURIComponent(reference)}`;
  }

  if (purchaseType === "premium-generation") {
    const topic = String(metadata.topic || "").trim();
    if (!topic) {
      return `/dashboard?tab=generate&payment=success&purchaseType=premium-generation&ref=${encodeURIComponent(reference)}`;
    }

    const params = new URLSearchParams({
      format: "course",
      difficulty: metadata.difficulty || "beginner",
      premiumRequested: "true",
      payment: "success",
      purchaseType: "premium-generation",
      ref: reference,
    });
    return `/learn/${encodeURIComponent(topic)}?${params.toString()}`;
  }

  if (purchaseType === "resume-export") {
    return `/dashboard?tab=career&tool=resume&payment=success&purchaseType=resume-export&historyId=${encodeURIComponent(
      metadata.historyId || ""
    )}&exportFormat=${encodeURIComponent(
      metadata.exportFormat || "docx"
    )}&ref=${encodeURIComponent(reference)}`;
  }

  return `/checkout/success?kind=subscription&plan=${encodeURIComponent(
    metadata.plan || "pro"
  )}&cycle=${encodeURIComponent(
    metadata.billingCycle || "monthly"
  )}&ref=${encodeURIComponent(reference)}`;
}

async function recordBillingEntry({ db, userId, data, metadata }) {
  const billingEntry = {
    type: metadata.purchaseType === "subscription" ? "subscription" : "one-time",
    description:
      metadata.purchaseType === "marketplace-course"
        ? `Marketplace course unlock: ${metadata.courseTitle || metadata.courseId}`
        : metadata.purchaseType === "premium-generation"
          ? `Premium course generation: ${metadata.topic}`
          : metadata.purchaseType === "resume-export"
            ? `Resume export: ${metadata.resumeTitle || metadata.historyId}`
          : `Subscription: ${metadata.plan || "pro"}`,
    plan: metadata.plan || metadata.purchaseType || "subscription",
    billingCycle: metadata.billingCycle || "monthly",
    amount: data.amount / 100,
    currency: data.currency,
    reference: data.reference,
    transactionId: data.id,
    status: "success",
    paymentMethod: data.channel,
    gateway: "paystack",
    gatewayResponse: data.gateway_response,
    paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
    metadata: {
      ...metadata,
      authorization_code: data.authorization?.authorization_code,
      card_type: data.authorization?.card_type,
      last4: data.authorization?.last4,
    },
  };

  await db.collection("users").updateOne(
    { _id: new ObjectId(userId) },
    { $push: { billingHistory: billingEntry } }
  );
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

async function applySuccessfulPayment({ db, user, data, metadata }) {
  const purchaseType = metadata.purchaseType || "subscription";

  if (purchaseType === "marketplace-course") {
    await grantMarketplaceCourseAccess({
      db,
      userId: user._id.toString(),
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
      userId: user._id.toString(),
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
      userId: user._id.toString(),
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
    { _id: user._id },
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
        "subscription.autoRenew": true,
      },
    }
  );
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference") || searchParams.get("trxref");

    if (!reference) {
      return redirectTo(request, "/dashboard?payment=error&msg=no-reference");
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!verifyRes.ok) {
      return redirectTo(request, "/dashboard?payment=error&msg=provider-error");
    }

    const { status, data } = await verifyRes.json();
    if (!status || !data || data.status !== "success") {
      return redirectTo(request, "/dashboard?payment=failed");
    }

    const metadata = data.metadata || {};
    const userId = metadata.userId;
    if (!userId || !ObjectId.isValid(userId)) {
      return redirectTo(request, "/dashboard?payment=error&msg=no-user");
    }

    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return redirectTo(request, "/dashboard?payment=error&msg=user-not-found");
    }

    const alreadyProcessed = Array.isArray(user.billingHistory)
      ? user.billingHistory.some((entry) => entry.reference === data.reference)
      : false;

    if (!alreadyProcessed) {
      await recordBillingEntry({ db, userId, data, metadata });
      await applySuccessfulPayment({ db, user, data, metadata });
    }

    return redirectTo(request, getSuccessRedirect(metadata, data.reference));
  } catch (error) {
    console.error("Payment verification crashed:", error);
    return redirectTo(request, "/dashboard?payment=error&msg=server-error");
  }
}

export async function POST(request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Debug endpoint disabled" }, { status: 404 });
  }

  try {
    const { reference } = await request.json();
    if (!reference) {
      return NextResponse.json({ error: "reference required" }, { status: 400 });
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    return NextResponse.json({
      reference,
      success: data.status && data.data?.status === "success",
      data: data.data,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
