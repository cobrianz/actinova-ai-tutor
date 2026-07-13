import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "./mongodb";
import { hasItem, PRODUCTS } from "./planLimits";

const rateLimitMap = new Map();

export function withAPIRateLimit(handler, options = {}) {
  const maxRequests = options.max || 60;
  const windowMs = options.windowMs || 60000;
  return async (req, context) => {
    const ip = req.headers?.get("x-forwarded-for") || req.headers?.get("x-real-ip") || "unknown";
    const now = Date.now();
    const windowStart = now - windowMs;
    for (const [key, data] of rateLimitMap.entries()) {
      if (data.timestamp < windowStart) rateLimitMap.delete(key);
    }
    const current = rateLimitMap.get(ip) || { count: 0, timestamp: now };
    if (current.timestamp < windowStart) { current.count = 0; current.timestamp = now; }
    if (current.count >= maxRequests) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": Math.ceil(windowMs / 1000) } });
    }
    current.count++;
    rateLimitMap.set(ip, current);
    return handler(req, context);
  };
}

/**
 * Track API usage for a user.
 * Called as: trackAPIUsage(userId, feature, options?)
 */
export async function trackAPIUsage(userId, feature, options = {}) {
  try {
    const { db } = await connectToDatabase();
    await db.collection("users").updateOne(
      { _id: typeof userId === "string" ? new ObjectId(userId) : userId },
      { $inc: { [`usage.${feature}`]: 1 }, $set: { lastActivity: new Date() } }
    );
  } catch (err) {
    console.warn("trackAPIUsage error:", err.message);
  }
}

/**
 * Check if user has access to a feature based on credits.
 * @param {Db} db - MongoDB database instance
 * @param {Object} user - Full user document (with credits, purchasedItems)
 * @param {string} feature - Feature ID from PRODUCTS (e.g. "course_generation")
 * @returns {{ allowed: boolean, tier: string, credits: number, creditCost: number }}
 */
export async function checkAPILimit(db, user, feature) {
  // If user purchased this feature outright, always allow
  if (hasItem(user, feature)) {
    return { allowed: true, tier: "purchased", credits: user.credits || 0, creditCost: 0 };
  }

  const product = PRODUCTS.find(p => p.id === feature);
  if (!product) {
    return { allowed: true, tier: "free", credits: user.credits || 0, creditCost: 0 };
  }

  const credits = user.credits || 0;
  const creditCost = product.creditCost;

  if (credits >= creditCost) {
    // Deduct credits
    try {
      await db.collection("users").updateOne(
        { _id: user._id },
        { $inc: { credits: -creditCost }, $set: { lastActivity: new Date() } }
      );
      return { allowed: true, tier: "credits", credits: credits - creditCost, creditCost };
    } catch (err) {
      console.error("Failed to deduct credits:", err);
      return { allowed: false, tier: "free", credits, creditCost };
    }
  }

  return { allowed: false, tier: "free", credits, creditCost };
}

export async function checkCourseAccess(db, userId, courseId, shareId) {
  try {
    if (!courseId && !shareId) {
      return { hasAccess: false, isShared: false, isEnrolled: false, fullAccess: false, sharerTier: null, reason: "No course or share ID provided" };
    }

    let isShared = false;
    let isEnrolled = false;
    let fullAccess = false;
    let sharerTier = null;
    let hasAccess = false;

    if (shareId) {
      const shareConfig = await db.collection("library").findOne(
        { "shareConfigs.shareId": shareId },
        { projection: { "shareConfigs.$": 1 } }
      );
      if (shareConfig?.shareConfigs?.[0]) {
        const config = shareConfig.shareConfigs[0];
        isShared = config.isActive === true;
        sharerTier = config.tier || "free";
        fullAccess = isShared && sharerTier !== "free";
        hasAccess = isShared;
      }
    }

    if (courseId && ObjectId.isValid(courseId) && userId && ObjectId.isValid(userId)) {
      const courseDoc = await db.collection("library").findOne(
        { _id: new ObjectId(courseId) },
        { projection: { userId: 1, enrolled: 1, isShared: 1, sharerTier: 1 } }
      );

      if (courseDoc) {
        if (String(courseDoc.userId) === String(userId)) {
          hasAccess = true;
          fullAccess = true;
        }

        if (Array.isArray(courseDoc.enrolled)) {
          const enrollment = courseDoc.enrolled.find(
            (e) => String(e.userId || e) === String(userId)
          );
          if (enrollment) {
            isEnrolled = true;
            hasAccess = true;
            if (courseDoc.isShared && courseDoc.sharerTier !== "free") {
              fullAccess = true;
            }
          }
        }
      }
    }

    return { hasAccess, isShared, isEnrolled, fullAccess, sharerTier };
  } catch (err) {
    console.error("checkCourseAccess error:", err);
    return { hasAccess: false, isShared: false, isEnrolled: false, fullAccess: false, sharerTier: null, reason: err.message };
  }
}
