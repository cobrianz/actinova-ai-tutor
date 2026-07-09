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

export async function trackAPIUsage(db, userId, feature) {
  try {
    const usersCol = db.collection("users");
    await usersCol.updateOne(
      { _id: userId },
      { $inc: { [`usage.${feature}`]: 1 }, $set: { lastActivity: new Date() } }
    );
  } catch (err) {
    console.warn("trackAPIUsage error:", err.message);
  }
}

export async function checkAPILimit(db, user, feature) {
  const product = PRODUCTS.find(p => p.id === feature);
  if (product && hasItem(user, product.id)) {
    return { allowed: true, tier: "purchased" };
  }
  return { allowed: true, tier: "free" };
}

export async function checkCourseAccess(db, userId, courseId, shareId) {
  try {
    // If no identifiers, deny access
    if (!courseId && !shareId) {
      return { hasAccess: false, isShared: false, isEnrolled: false, fullAccess: false, sharerTier: null, reason: "No course or share ID provided" };
    }

    let isShared = false;
    let isEnrolled = false;
    let fullAccess = false;
    let sharerTier = null;
    let hasAccess = false;

    // Check share access first
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

    // Check course ownership/enrollment
    if (courseId && ObjectId.isValid(courseId) && userId && ObjectId.isValid(userId)) {
      const courseDoc = await db.collection("library").findOne(
        { _id: new ObjectId(courseId) },
        { projection: { userId: 1, enrolled: 1, isShared: 1, sharerTier: 1 } }
      );

      if (courseDoc) {
        // Owner always has access
        if (String(courseDoc.userId) === String(userId)) {
          hasAccess = true;
          fullAccess = true;
        }

        // Check enrollment
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
