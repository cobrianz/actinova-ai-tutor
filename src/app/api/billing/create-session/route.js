import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/middleware";
import { verifyToken } from "@/lib/auth";
import { findUserById } from "@/lib/db";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Pricing in KES cents (Paystack requires smallest currency unit)
const PLANS = {
  pro: {
    monthly: {
      amount: 451500, // KES 4,515.00 (approx $35 USD)
      name: "Pro Plan - Monthly",
      kes: 4515,
      usd: 35,
      interval: "monthly",
    },
    yearly: {
      amount: 4979400, // KES 49,794.00 (approx $386 USD, 7% off)
      name: "Pro Plan - Yearly (Save 7%)",
      kes: 49794,
      usd: 386,
      interval: "yearly",
    },
  },
};

async function createCheckoutSessionHandler(request) {
  // Checkout handler invoked

  let user = request.user;

  // Helper: robust token extraction from several places (Request cookies API, cookie header, Authorization)
  const extractToken = () => {
    try {
      // 1. Try Request cookies API (available in some runtimes)
      const cookieApiToken = request.cookies?.get?.("token")?.value;
      if (cookieApiToken) return cookieApiToken;
    } catch (e) {}

    // 2. Try Authorization header
    try {
      const ah = request.headers.get("authorization");
      if (ah && ah.startsWith("Bearer ")) return ah.replace("Bearer ", "");
      if (ah) return ah;
    } catch (e) {}

    // 3. Parse raw Cookie header
    try {
      const raw = request.headers.get("cookie");
      if (raw) {
        const parts = raw.split(";").map((p) => p.trim());
        for (const p of parts) {
          if (p.startsWith("token=")) return p.slice("token=".length);
        }
      }
    } catch (e) {}

    return null;
  };

  if (!user || !user?._id) {
    try {
      const token = extractToken();
      if (token) {
        let decoded;
          try {
            decoded = verifyToken(token);
          } catch (e) {
            // token verification failed
          }

        if (decoded?.id) {
          let found = null;
          try {
            found = await findUserById(decoded.id);
          } catch (e) {
            console.warn("Checkout: findUserById threw", e.message || e);
          }

          // If Mongoose lookup didn't find user, try native driver lookup
          if (!found) {
            try {
              const { db } = await connectToDatabase();
              const objId = new ObjectId(decoded.id);
              found = await db.collection("users").findOne({ _id: objId });
              // if found via native driver, attach user (no logging of PII)
            } catch (e) {
              console.warn("Checkout: native DB lookup failed", e.message || e);
            }
          }

          if (found) {
            user = found;
          }
        }
      }
    } catch (err) {
      console.warn("Checkout: fallback token extraction failed", err.message || err);
    }
  }

  if (!user?._id || !user?.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error("PAYSTACK_SECRET_KEY missing");
      return NextResponse.json(
        { error: "Payment service unavailable" },
        { status: 500 }
      );
    }

    const {
      plan = "pro",
      billingCycle = "monthly",
      paymentMethod = "card",
    } = await request.json();

    const cycle =
      billingCycle.toLowerCase() === "yearly" ? "yearly" : "monthly";
    const planConfig = PLANS.pro[cycle];

    if (!planConfig) {
      return NextResponse.json(
        { error: "Invalid billing cycle" },
        { status: 400 }
      );
    }

    // Dynamic origin for callback URL
    const host = request.headers.get("host") || "localhost:3000";
    const protocol =
      request.headers.get("x-forwarded-proto")?.split(",").shift() ||
      (host.includes("localhost") ? "http" : "https");
    const origin = `${protocol}://${host}`;
    const callbackUrl = `${origin}/api/billing/verify-payment`;

    console.warn(`[Checkout] ${user.email} → KES ${planConfig.kes} ${cycle}`);

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: planConfig.amount, // in cents
          currency: "KES", // Kenyan Shilling
          callback_url: callbackUrl,
          metadata: {
            userId: user._id.toString(),
            plan: "pro",
            billingCycle: cycle,
            kesAmount: planConfig.kes,
            usdAmount: planConfig.usd,
          },
          channels: paymentMethod === "card" ? ["card"] : undefined,
          custom_fields: [
            {
              display_name: "Customer",
              variable_name: "customer",
              value: user.name || user.email.split("@")[0],
            },
            {
              display_name: "Plan",
              variable_name: "plan",
              value: `${planConfig.name} ($${planConfig.usd})`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Paystack error:", err);
      return NextResponse.json(
        { error: "Payment failed to initialize", details: err.message },
        { status: 502 }
      );
    }

    const { status, data } = await response.json();

    if (!status || !data?.authorization_url || !data?.reference) {
      console.error("Invalid Paystack response:", data);
      return NextResponse.json(
        { error: "Failed to create payment session" },
        { status: 500 }
      );
    }

    console.warn(
      `Success: Paystack session created → KES ${planConfig.kes} | Ref: ${data.reference}`
    );

    // Provide safe user info alongside session so UI can use it immediately
    const safeUser = {
      id: user._id?.toString?.() || user._id,
      email: user.email,
      name: user.name || (user.email || "").split("@")[0],
      avatar: user.avatar || null,
      emailVerified: !!user.emailVerified,
      status: user.status,
      onboardingCompleted: !!user.onboardingCompleted,
      isPremium: !!user.isPremium,
      subscription: user.subscription || null,
    };

    return NextResponse.json({
      success: true,
      sessionUrl: data.authorization_url,
      reference: data.reference,
      amount: planConfig.kes,
      currency: "KES",
      billingCycle: cycle,
      user: safeUser,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        message:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export const POST = withErrorHandling(createCheckoutSessionHandler);
