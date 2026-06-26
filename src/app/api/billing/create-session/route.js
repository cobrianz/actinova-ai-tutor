import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import { withErrorHandling, withAuth, combineMiddleware } from "@/lib/middleware";
import { MARKETPLACE_PRICE_USD } from "@/lib/courseCommerce";
import { PRODUCTS, CREDIT_PACKS } from "@/lib/planLimits";

const RESUME_EXPORT_PRICE_USD = 2.5;

function looksKenyan(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return false;

  return (
    text === "ke" ||
    text === "kenya" ||
    text === "+254" ||
    text.startsWith("+254") ||
    text.startsWith("254") ||
    text.includes("nairobi") ||
    text.includes("kenya")
  );
}

function shouldUseKenyanMobileCheckout({ request, user, body }) {
  const explicitMethod = String(body.paymentMethod || "").toLowerCase();
  if (explicitMethod === "card") return false;
  if (explicitMethod === "mobile_money") return true;

  const countryHints = [
    body.country,
    body.countryCode,
    user?.country,
    user?.location,
    user?.profile?.country,
    user?.profile?.location,
    user?.subscription?.country,
    request.headers.get("x-vercel-ip-country"),
    request.headers.get("cf-ipcountry"),
  ];

  return countryHints.some(looksKenyan);
}

async function initializePaystackTransaction(payload) {
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Payment failed to initialize");
  }

  const parsed = await response.json();
  if (!parsed?.status || !parsed?.data?.authorization_url) {
    throw new Error("Invalid payment session response");
  }

  return parsed.data;
}

async function resolveAmountAndMetadata({ db, body, userId }) {
  const purchaseType = body.purchaseType || "subscription";

  if (purchaseType === "marketplace-course") {
    if (!body.courseId || !ObjectId.isValid(body.courseId)) {
      throw new Error("Valid courseId is required");
    }

    const course = await db.collection("courses").findOne({
      _id: new ObjectId(body.courseId),
      isGlobal: true,
      isPublished: true,
      isPremium: true,
    });

    if (!course) {
      throw new Error("Marketplace course not found");
    }

    return {
      purchaseType,
      amountUsd: Number(course.price || MARKETPLACE_PRICE_USD),
      name: `Unlock ${course.title}`,
      metadata: {
        purchaseType,
        courseId: course._id.toString(),
        courseTitle: course.title,
      },
    };
  }

  if (purchaseType === "premium-generation") {
    const topic = String(body.topic || "").trim();
    const difficulty = String(body.difficulty || "beginner").trim().toLowerCase();

    if (!topic) {
      throw new Error("Topic is required for premium generation");
    }

    return {
      purchaseType,
      amountUsd: MARKETPLACE_PRICE_USD,
      name: `Premium generation for ${topic}`,
      metadata: {
        purchaseType,
        topic,
        difficulty,
      },
    };
  }

  if (purchaseType === "resume-export") {
    if (!body.historyId || !ObjectId.isValid(body.historyId)) {
      throw new Error("Valid historyId is required");
    }

    const exportFormat = String(body.exportFormat || "docx").toLowerCase();
    if (!["docx", "pdf"].includes(exportFormat)) {
      throw new Error("Valid exportFormat is required");
    }

    const resume = await db.collection("careerhistories").findOne({
      _id: new ObjectId(body.historyId),
      userId: new ObjectId(userId),
      type: "resume",
    });

    if (!resume) {
      throw new Error("Saved resume not found");
    }

    return {
      purchaseType,
      amountUsd: RESUME_EXPORT_PRICE_USD,
      name: `Export ${resume.title || "resume"}`,
      metadata: {
        purchaseType,
        historyId: resume._id.toString(),
        exportFormat,
        resumeTitle: resume.title || "Resume",
      },
    };
  }

  if (purchaseType === "item") {
    const itemType = String(body.itemType || "").trim();
    const product = PRODUCTS.find((p) => p.id === itemType);
    if (!product) {
      throw new Error("Invalid item type");
    }
    return {
      purchaseType: "item",
      amountUsd: product.price,
      name: product.name,
      metadata: {
        purchaseType: "item",
        itemType: product.id,
      },
    };
  }

  if (purchaseType === "credit-purchase") {
    const packId = String(body.packId || "").trim();
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
      throw new Error("Invalid credit pack");
    }
    return {
      purchaseType: "credit-purchase",
      amountUsd: pack.price,
      name: `${pack.credits} Credits`,
      metadata: {
        purchaseType: "credit-purchase",
        packId: pack.id,
        credits: pack.credits,
      },
    };
  }

  // Legacy subscription support (deprecated, kept for existing users)
  const plan = body.plan || "pro";
  const billingCycle = String(body.billingCycle || "monthly").toLowerCase() === "yearly"
    ? "yearly"
    : "monthly";

  let plans = await db.collection("plans").find({ status: "active" }).toArray();
  if (!plans.length) {
    plans = [
      { id: "premium", name: "Premium", price: 9.99, yearlyPrice: 111.49 },
      { id: "enterprise", name: "Enterprise", price: 29.99, yearlyPrice: 334.69 },
    ];
  }

  const selectedPlan = plans.find((candidate) => {
    const candidateId = candidate.id || String(candidate.name || "").toLowerCase();
    return candidateId === plan || (plan === "pro" && candidateId === "premium");
  });

  if (!selectedPlan) {
    throw new Error("Invalid plan selected");
  }

  const amountUsd = billingCycle === "yearly"
    ? Number(selectedPlan.yearlyPrice || (selectedPlan.price || 0) * 12 * 0.93)
    : Number(selectedPlan.price || 0);

  return {
    purchaseType: "subscription",
    amountUsd,
    name: selectedPlan.name,
    metadata: {
      purchaseType: "subscription",
      plan,
      billingCycle,
    },
  };
}

async function convertUsdToKes(amountUsd) {
  let exchangeRate = 129;

  try {
    const rateRes = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (rateRes.ok) {
      const rateData = await rateRes.json();
      if (rateData?.rates?.KES) {
        exchangeRate = rateData.rates.KES;
      }
    }
  } catch (error) {
    console.warn("Exchange rate fetch failed, using fallback", error);
  }

  return Math.ceil((amountUsd * exchangeRate) / 10) * 10;
}

async function handlePost(request) {
  const user = request.user;

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json(
      { error: "Payment service unavailable" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { db } = await connectToDatabase();

  const { purchaseType, amountUsd, name, metadata } = await resolveAmountAndMetadata({
    db,
    body,
    userId: user._id.toString(),
  });

  const isCoursePurchase =
    purchaseType === "marketplace-course" || purchaseType === "premium-generation";
  const requestedPaymentMethod = String(body.paymentMethod || "").toLowerCase();
  const useKenyanMobileCheckout = shouldUseKenyanMobileCheckout({ request, user, body });
  const paymentMethod =
    requestedPaymentMethod || (useKenyanMobileCheckout ? "mobile_money" : isCoursePurchase ? "multi_channel" : "card");

  let currency = "USD";
  let amount = Math.round(amountUsd * 100);
  let channels = ["card"];
  let kesAmount = null;

  if (paymentMethod === "mobile_money") {
    currency = "KES";
    channels = ["mobile_money", "card", "bank_transfer", "ussd"];
    kesAmount = await convertUsdToKes(amountUsd);
    amount = kesAmount * 100;
  } else if (isCoursePurchase) {
    channels = ["card", "mobile_money", "bank_transfer", "ussd"];
  }

  const host = request.headers.get("host") || "localhost:3000";
  const protocol =
    request.headers.get("x-forwarded-proto")?.split(",").shift() ||
    (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const callbackUrl = `${origin}/api/billing/verify-payment`;

  const session = await initializePaystackTransaction({
    email: user.email,
    amount,
    currency,
    callback_url: callbackUrl,
    channels,
    metadata: {
      userId: user._id.toString(),
      paymentMethod,
      usdAmount: Number(amountUsd.toFixed(2)),
      kesAmount: kesAmount || undefined,
      ...metadata,
    },
    custom_fields: [
      {
        display_name: "Customer",
        variable_name: "customer",
        value: user.name || user.email.split("@")[0],
      },
      {
        display_name: "Purchase",
        variable_name: "purchase",
        value: name,
      },
    ],
  });

  return NextResponse.json({
    success: true,
    sessionUrl: session.authorization_url,
    reference: session.reference,
    purchaseType,
    amount,
    currency,
  });
}

export const POST = combineMiddleware(
  withErrorHandling,
  withAuth
)(handlePost);
