/**
 * Plan Expiry & Subscription Validation Middleware
 * Ensures users with expired plans are downgraded to free tier
 * and prevents access to premium features without valid subscription
 */

import { NextResponse } from "next/server";
import { connectToDatabase } from "./mongodb";
import { ObjectId } from "mongodb";

/**
 * Check if user's subscription has expired
 * @param {Object} user - User object with subscription data
 * @returns {Boolean} true if plan is valid, false if expired
 */
export const isPlanValid = (user) => {
  if (!user?.subscription?.expiryDate) return true; // No subscription = free tier
  return new Date(user.subscription.expiryDate) > new Date();
};

/**
 * Check if user has active subscription for paid tier
 * @param {String} tier - Subscription tier ('free', 'pro', 'enterprise')
 * @returns {Boolean} true if user has paid tier
 */
export const hasPaidPlan = (tier) => {
  return tier && tier !== "free" && tier !== "trial";
};

/**
 * Middleware: Validate subscription status
 * Downgrades user to free tier if plan expired
 * Call this on all protected routes to ensure compliance
 */
export async function validateSubscriptionStatus(userId) {
  try {
    const { db } = await connectToDatabase();
    
    // Get user
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });

    if (!user) return null;

    // Check if subscription expired
    if (
      user.subscription?.expiryDate &&
      new Date(user.subscription.expiryDate) < new Date()
    ) {
      // Downgrade to free tier
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            "subscription.tier": "free",
            "subscription.status": "expired",
            "subscription.downgradedAt": new Date(),
            "subscription.expiryDate": null,
          },
        }
      );

      // Return updated user with free tier
      return {
        ...user,
        subscription: {
          tier: "free",
          status: "expired",
          expiryDate: null,
        },
      };
    }

    return user;
  } catch (error) {
    console.error("Error validating subscription:", error);
    throw error;
  }
}

/**
 * Middleware: Check if user can access course
 * Validates plan tier and course premium status
 */
export async function checkCourseAccess(userId, courseId) {
  try {
    const { db } = await connectToDatabase();

    // Get user with updated subscription
    const user = await validateSubscriptionStatus(userId);
    if (!user) return { hasAccess: false, reason: "User not found" };

    // Get course
    const course = await db
      .collection("courses")
      .findOne({ _id: new ObjectId(courseId) });

    if (!course) return { hasAccess: false, reason: "Course not found" };

    // Free course - everyone has access
    if (!course.isPremium) {
      return { hasAccess: true };
    }

    // Premium course - requires paid plan
    if (hasPaidPlan(user.subscription?.tier)) {
      // Check subscription status
      if (!isPlanValid(user)) {
        return {
          hasAccess: false,
          reason: "Subscription expired",
          expiryDate: user.subscription?.expiryDate,
        };
      }

      // Check if plan tier meets course requirement
      const courseTierRequired = course.tierRequired || "pro";
      const tierHierarchy = { free: 0, pro: 1, enterprise: 2 };
      const userTierLevel = tierHierarchy[user.subscription?.tier] || 0;
      const requiredTierLevel = tierHierarchy[courseTierRequired] || 0;

      if (userTierLevel >= requiredTierLevel) {
        return { hasAccess: true };
      }

      return {
        hasAccess: false,
        reason: "Insufficient plan tier",
        requiredTier: courseTierRequired,
        userTier: user.subscription?.tier,
      };
    }

    return { hasAccess: false, reason: "Premium subscription required" };
  } catch (error) {
    console.error("Error checking course access:", error);
    throw error;
  }
}

/**
 * Track API usage for rate limiting by plan tier
 * Call this in endpoints that should be rate-limited
 */
export async function trackAPIUsage(userId, apiName) {
  try {
    const { db } = await connectToDatabase();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Increment usage count for this month
    await db.collection("api_usage").updateOne(
      {
        userId: new ObjectId(userId),
        apiName,
        month: monthStart,
      },
      {
        $inc: { count: 1 },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    // Get current usage
    const usage = await db.collection("api_usage").findOne({
      userId: new ObjectId(userId),
      apiName,
      month: monthStart,
    });

    return usage?.count || 0;
  } catch (error) {
    console.error("Error tracking API usage:", error);
    return 0; // Fail open - allow request if tracking fails
  }
}

/**
 * Check if user has exceeded API limit for their plan tier
 */
export async function checkAPILimit(userId, apiName) {
  try {
    // Get user to determine plan tier
    const { db } = await connectToDatabase();
    const user = await validateSubscriptionStatus(userId);

    if (!user) {
      return { withinLimit: false, reason: "User not found" };
    }

    // Define limits by tier
    const limits = {
      free: 5,
      pro: 50,
      enterprise: Infinity,
    };

    const tierLimit = limits[user.subscription?.tier || "free"] || 5;

    // Get current usage
    const currentUsage = await trackAPIUsage(userId, apiName);

    return {
      withinLimit: currentUsage <= tierLimit,
      currentUsage,
      limit: tierLimit,
      remaining: Math.max(0, tierLimit - currentUsage),
    };
  } catch (error) {
    console.error("Error checking API limit:", error);
    return { withinLimit: true, reason: "Error checking limit - failing open" };
  }
}

/**
 * Middleware wrapper for validating API limits
 * Use this in API routes that need rate limiting
 */
export async function withAPIRateLimit(handler, apiName) {
  return async (request) => {
    try {
      // Get user from middleware
      const user = request.user;
      if (!user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      // Check API limit
      const limitCheck = await checkAPILimit(user._id, apiName);

      if (!limitCheck.withinLimit) {
        return NextResponse.json(
          {
            error: "API rate limit exceeded",
            message: `You have reached your limit of ${limitCheck.limit} calls per month for ${apiName}`,
            tier: user.subscription?.tier,
            resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          },
          { status: 429, headers: { "Retry-After": "2592000" } } // 30 days
        );
      }

      // Call handler
      const response = await handler(request);

      // Add usage info to response
      response.headers.set("X-API-Limit", limitCheck.limit.toString());
      response.headers.set("X-API-Remaining", limitCheck.remaining.toString());
      response.headers.set("X-API-Used", limitCheck.currentUsage.toString());

      return response;
    } catch (error) {
      console.error("Error in API rate limit middleware:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Check if plan is expiring soon (within 7 days)
 * Use for showing renewal reminders
 */
export const isExpiringsoon = (expiryDate) => {
  if (!expiryDate) return false;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = (expiry - now) / (1000 * 60 * 60 * 24);
  return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
};

/**
 * Get days remaining on subscription
 */
export const getDaysRemaining = (expiryDate) => {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysRemaining);
};
