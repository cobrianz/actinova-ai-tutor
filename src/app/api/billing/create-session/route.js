export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";
import { CREDIT_PACKS } from "@/lib/planLimits";
import { usdToKes, getUsdToKesRate } from "@/lib/currency";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function handlePost(request) {
  const user = request.user;

  try {
    const body = await request.json();
    const { purchaseType, paymentMethod = "card" } = body;

    if (!purchaseType) {
      return NextResponse.json({ error: "purchaseType is required" }, { status: 400 });
    }

    const isMpesa = paymentMethod === "mpesa";
    const { db } = await connectToDatabase();
    const userEmail = user.email;

    // Get exchange rate upfront if M-Pesa
    let exchangeRate = 1;
    if (isMpesa) {
      exchangeRate = await getUsdToKesRate();
    }

    let amountUsdCents; // amount in USD cents for metadata
    let metadata;
    let callbackUrl;

    switch (purchaseType) {
      case "credit-purchase": {
        const { packId } = body;
        const pack = CREDIT_PACKS.find((p) => p.id === packId);
        if (!pack) {
          return NextResponse.json({ error: "Invalid credit pack" }, { status: 400 });
        }
        amountUsdCents = Math.round(pack.price * 100);
        metadata = {
          userId: String(user._id),
          purchaseType: "credit-purchase",
          packId: pack.id,
          credits: pack.credits,
          paymentMethod,
          amountUsd: pack.price,
        };
        callbackUrl = `${APP_URL}/dashboard?payment=success&purchaseType=credit-purchase`;
        break;
      }

      case "premium-generation": {
        const { topic, difficulty } = body;
        amountUsdCents = 29900; // $29.99
        metadata = {
          userId: String(user._id),
          purchaseType: "premium-generation",
          topic: topic || "",
          difficulty: difficulty || "",
          paymentMethod,
          amountUsd: 29.99,
        };
        callbackUrl = `${APP_URL}/dashboard?payment=success&purchaseType=premium-generation`;
        break;
      }

      case "marketplace-course": {
        const { courseId } = body;
        if (!courseId) {
          return NextResponse.json({ error: "courseId is required" }, { status: 400 });
        }

        const course = await db.collection("library").findOne({
          _id: new ObjectId(courseId),
          format: "course",
          isPremium: true,
        });
        if (!course) {
          return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        const priceUsd = course.price || 19.99;
        amountUsdCents = Math.round(priceUsd * 100);
        metadata = {
          userId: String(user._id),
          purchaseType: "marketplace-course",
          courseId: String(course._id),
          courseTitle: course.title,
          paymentMethod,
          amountUsd: priceUsd,
        };
        callbackUrl = `${APP_URL}/premium-courses?payment=success&purchaseType=marketplace-course`;
        break;
      }

      case "resume-export": {
        const { historyId, exportFormat } = body;
        if (!historyId) {
          return NextResponse.json({ error: "historyId is required" }, { status: 400 });
        }
        amountUsdCents = 499; // $4.99
        metadata = {
          userId: String(user._id),
          purchaseType: "resume-export",
          historyId,
          exportFormat: exportFormat || "pdf",
          paymentMethod,
          amountUsd: 4.99,
        };
        callbackUrl = `${APP_URL}/dashboard?tab=career&payment=success&purchaseType=resume-export&historyId=${historyId}&exportFormat=${exportFormat || "pdf"}`;
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid purchaseType" }, { status: 400 });
    }

    // Convert amount based on payment method
    let paystackAmount;
    let currency;
    let channels;

    if (isMpesa) {
      // Convert USD cents to KES whole shillings, round up
      const usdDollars = amountUsdCents / 100;
      paystackAmount = await usdToKes(usdDollars);
      currency = "KES";
      channels = ["mobile_money"];
      metadata.kesAmount = paystackAmount;
      metadata.exchangeRate = exchangeRate;
    } else {
      paystackAmount = amountUsdCents; // Paystack uses cents for USD
      currency = "USD";
      channels = ["card"];
    }

    const response = await initializePaystack({
      email: userEmail,
      amount: paystackAmount,
      currency,
      channels,
      metadata,
      callback_url: callbackUrl,
    });

    if (!response || !response.status) {
      return NextResponse.json(
        { error: "Payment initialization failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionUrl: response.data.authorization_url,
      reference: response.data.reference,
      paymentMethod,
      currency,
      amount: paystackAmount,
    });
  } catch (error) {
    console.error("Billing create-session error:", error);
    throw error;
  }
}

async function initializePaystack({ email, amount, currency, channels, metadata, callback_url }) {
  const body = {
    email,
    amount,
    currency,
    channels,
    metadata,
    callback_url,
  };

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return res.json();
}

export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
