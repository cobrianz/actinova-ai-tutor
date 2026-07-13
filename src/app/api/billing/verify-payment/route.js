export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withAuth } from "@/lib/middleware";
import { CREDIT_PACKS } from "@/lib/planLimits";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

async function handleGet(request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("ref");

  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  if (!PAYSTACK_SECRET) {
    console.error("PAYSTACK_SECRET_KEY is not set");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  // Verify with Paystack
  let verifyData;
  try {
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    verifyData = await verifyRes.json();
  } catch (fetchErr) {
    console.error("Paystack API fetch failed:", fetchErr.message);
    return NextResponse.json({ error: "Could not reach Paystack", details: fetchErr.message }, { status: 502 });
  }

  console.log("Paystack verify:", JSON.stringify({ status: verifyData.status, dataStatus: verifyData.data?.status, reference }));

  if (!verifyData.status || verifyData.data?.status !== "success") {
    console.error("Paystack verification failed:", verifyData?.message || verifyData);
    return NextResponse.json({ error: "Payment not verified", details: verifyData?.message || "Transaction not successful" }, { status: 402 });
  }

  const metadata = verifyData.data.metadata || {};
  const userId = metadata.userId;
  const purchaseType = metadata.purchaseType;
  const paymentMethod = metadata.paymentMethod || "card";
  const isMpesa = paymentMethod === "mpesa";

  if (!userId || !purchaseType) {
    return NextResponse.json({ error: "Invalid payment metadata" }, { status: 400 });
  }

  const { db } = await connectToDatabase();
  const amountPaid = isMpesa ? verifyData.data.amount : verifyData.data.amount / 100;
  const currency = isMpesa ? "KES" : "USD";

  try {
    switch (purchaseType) {
      case "credit-purchase": {
        const pack = CREDIT_PACKS.find((p) => p.id === metadata.packId);
        if (!pack) {
          console.error("Invalid packId:", metadata.packId);
          break;
        }

        const updateResult = await db.collection("users").updateOne(
          { _id: new ObjectId(userId) },
          {
            $inc: { credits: pack.credits },
            $push: {
              billingHistory: {
                type: "credit_purchase",
                amount: amountPaid,
                currency,
                paymentMethod,
                credits: pack.credits,
                packId: pack.id,
                reference,
                createdAt: new Date(),
              },
            },
          }
        );
        console.log(`Credits: +${pack.credits} user=${userId} matched=${updateResult.matchedCount} modified=${updateResult.modifiedCount}`);
        break;
      }

      case "premium-generation": {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await db.collection("users").updateOne(
          { _id: new ObjectId(userId) },
          {
            $set: { premiumAccessExpiresAt: expiresAt, isPremium: true },
            $push: {
              billingHistory: { type: "premium_generation", amount: amountPaid, currency, paymentMethod, topic: metadata.topic, reference, createdAt: new Date() },
            },
          }
        );
        await db.collection("premium_generation_intents").insertOne({
          userId: new ObjectId(userId), topic: metadata.topic, difficulty: metadata.difficulty, reference, status: "paid", createdAt: new Date(),
        });
        break;
      }

      case "marketplace-course": {
        const courseId = metadata.courseId;
        if (!courseId) break;
        const accessExpires = new Date();
        accessExpires.setDate(accessExpires.getDate() + 30);
        await db.collection("users").updateOne(
          { _id: new ObjectId(userId) },
          {
            $push: {
              purchasedItems: { itemType: "marketplace-course", courseId: new ObjectId(courseId), courseTitle: metadata.courseTitle || "", accessExpiresAt: accessExpires, reference, purchasedAt: new Date() },
              billingHistory: { type: "marketplace_course", amount: amountPaid, currency, paymentMethod, courseId, courseTitle: metadata.courseTitle || "", reference, createdAt: new Date() },
            },
          }
        );
        break;
      }

      case "resume-export": {
        const { historyId, exportFormat } = metadata;
        if (!historyId) break;
        await db.collection("careerhistories").updateOne(
          { _id: new ObjectId(historyId), userId: new ObjectId(userId) },
          { $set: { "metadata.exportPaid": true, "metadata.exportPaidAt": new Date(), "metadata.exportFormat": exportFormat, "metadata.exportReference": reference } }
        );
        await db.collection("users").updateOne(
          { _id: new ObjectId(userId) },
          { $push: { billingHistory: { type: "resume_export", amount: amountPaid, currency, paymentMethod, historyId, exportFormat, reference, createdAt: new Date() } } }
        );
        break;
      }
    }
  } catch (dbErr) {
    console.error("DB update failed after Paystack verification:", dbErr);
    return NextResponse.json({ error: "Payment verified but update failed", details: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, purchaseType, reference });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
