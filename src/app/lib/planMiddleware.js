/**
 * Plan Expiry & Subscription Validation Middleware
 * Ensures users with expired plans are downgraded to free tier
 * and prevents access to premium features without valid subscription
 */

import { NextResponse } from "next/server";
import { connectToDatabase } from "./mongodb";
import { ObjectId } from "mongodb";

/**
 * Standard Tier Constants
 */
export const TIERS = {
    FREE: "free",
    PRO: "pro",
    ENTERPRISE: "enterprise",
};

/**
 * Tier Hierarchy for access control
 */
export const TIER_LEVELS = {
    [TIERS.FREE]: 0,
    [TIERS.PRO]: 1,
    [TIERS.ENTERPRISE]: 2,
};

export function hasPurchasedItem(user, itemType) {
    if (!user) return false;
    if (user.isPremium) return true;
    return user.purchasedItems?.some((p) => p.itemType === itemType);
}

/**
 * Check if user's subscription has expired
 * @param {Object} user - User object with subscription data
 * @returns {Boolean} true if plan is valid, false if expired
 */
export const isPlanValid = (user) => {
    if (hasPurchasedItem(user, "course_generation")) return true;
    if (hasPurchasedItem(user, "report_generation")) return true;
    if (hasPurchasedItem(user, "career_tools")) return true;
    if (hasPurchasedItem(user, "exam_generation")) return true;
    if (hasPurchasedItem(user, "flashcard_generation")) return true;
    if (user?.isPremium) return true;

    const sub = user?.subscription || {};
    const effectiveExpiry =
        sub.currentPeriodEnd || sub.expiryDate || sub.expiresAt || null;

    if (!effectiveExpiry) return true;
    return new Date(effectiveExpiry) > new Date();
};

/**
 * Check if user has active access to paid features
 * @param {Object} user - User object
 * @returns {Boolean} true if user has purchases or active subscription
 */
export const hasPaidPlan = (user) => {
    if (!user) return false;
    if (user.isPremium) return true;
    if (user.purchasedItems?.length > 0) return true;
    const tier = user.subscription?.tier || user.subscription?.plan;
    return (tier === TIERS.PRO || tier === TIERS.ENTERPRISE) &&
        user.subscription?.status === "active";
};

/**
 * Validate subscription status and perform auto-downgrade if expired
 * @param {String} userId - User ID
 * @returns {Object|null} Updated user object or null
 */
export async function validateSubscriptionStatus(userId) {
    try {
        const { db } = await connectToDatabase();

        if (!userId) return null;

        const user = await db
            .collection("users")
            .findOne({ _id: new ObjectId(userId) });

        if (!user) return null;

        const sub = user.subscription || {};
        const effectiveExpiry =
            sub.currentPeriodEnd || sub.expiryDate || sub.expiresAt || null;

        // If subscription has expired, downgrade to free tier automatically
        // (but only if user has no purchased items - those are permanent)
        if (
            !hasPurchasedItem(user, "course_generation") &&
            !hasPurchasedItem(user, "report_generation") &&
            !hasPurchasedItem(user, "career_tools") &&
            !hasPurchasedItem(user, "exam_generation") &&
            !hasPurchasedItem(user, "flashcard_generation") &&
            effectiveExpiry &&
            new Date(effectiveExpiry) < new Date() &&
            sub?.tier !== TIERS.FREE
        ) {
            const downgradeData = {
                "subscription.tier": TIERS.FREE,
                "subscription.status": "expired",
                "subscription.downgradedAt": new Date(),
                "subscription.expiryDate": null,
                "subscription.expiresAt": null,
                "subscription.currentPeriodEnd": null,
                isPremium: false,
            };

            await db.collection("users").updateOne(
                { _id: new ObjectId(userId) },
                { $set: downgradeData }
            );

            return {
                ...user,
                subscription: {
                    ...sub,
                    tier: TIERS.FREE,
                    status: "expired",
                    expiryDate: null,
                    expiresAt: null,
                    currentPeriodEnd: null,
                },
                isPremium: false,
            };
        }

        return user;
    } catch (error) {
        console.error("Error validating subscription:", error);
        return null;
    }
}

/**
 * Check if user can access a specific course
 */
export async function checkCourseAccess(userId, courseId, shareId = null) {
    try {
        const { db } = await connectToDatabase();

        // 1. Check if it's a shared course (Public Access via Share Link)
        if (shareId) {
            const sharedCourse = await db.collection("library").findOne({ 
                $or: [
                    { shareId: shareId, isShared: true },
                    { "shareConfigs": { $elemMatch: { shareId: shareId, isActive: true } } }
                ]
            });

            if (sharedCourse) {
                // Determine depth based on the SPECIFIC share config used
                let sharerTier = sharedCourse.sharePlan || (sharedCourse.isPremium ? TIERS.PRO : TIERS.FREE);
                
                if (Array.isArray(sharedCourse.shareConfigs)) {
                    const config = sharedCourse.shareConfigs.find(c => c.shareId === shareId);
                    if (config && config.isActive) sharerTier = config.tier;
                }

                // If course was shared by a Pro/Enterprise user, they get full access
                if (hasPaidPlan(sharerTier)) {
                    return { hasAccess: true, isShared: true, fullAccess: true };
                }
                
                return { hasAccess: true, isShared: true, fullAccess: false };
            }
        }

        // Always validate subscription first (handles auto-downgrade)
        // If no userId, and not a sharedId case above, no access
        if (!userId) return { hasAccess: false, reason: "Unauthorized" };

        const user = await validateSubscriptionStatus(userId);
        if (!user) return { hasAccess: false, reason: "User not found" };
        const userObjId = new ObjectId(userId);

        // Check library for personalized or shared courses first
        const libCourse = await db.collection("library").findOne({
            _id: new ObjectId(courseId),
            $or: [
                { userId: userObjId },
                { "enrolled.userId": userObjId }, // New format
                { enrolled: userObjId } // Legacy format
            ]
        });

        if (libCourse) {
            const isOwner = libCourse.userId.toString() === userId.toString();
            
            // Owners and users who purchased course generation always get full access
            if (isOwner || hasPurchasedItem(user, "course_generation") || hasPaidPlan(user)) {
                return { hasAccess: true, isShared: false, fullAccess: true };
            }

            // For enrollees, determine access level via the share chain
            let fullAccess = false;
            if (libCourse.isShared) {
                // Find the enrollment record to see who invited them
                const enrollment = Array.isArray(libCourse.enrolled) 
                    ? libCourse.enrolled.find(e => (e.userId || e).toString() === userId.toString())
                    : null;
                
                let sharerTier = libCourse.sharePlan || TIERS.FREE; // Default to owner tier
                
                if (enrollment && enrollment.invitedByShareId && Array.isArray(libCourse.shareConfigs)) {
                    const config = libCourse.shareConfigs.find(c => c.shareId === enrollment.invitedByShareId);
                    if (config && config.isActive) sharerTier = config.tier;
                }

                if (hasPaidPlan(sharerTier)) {
                    fullAccess = true;
                }
            }

            return { 
                hasAccess: true, 
                isEnrolled: !isOwner,
                sharerTier: libCourse.sharerTier || libCourse.sharePlan || TIERS.FREE,
                isShared: !!libCourse.isShared,
                fullAccess: fullAccess
            };
        }

        const course = await db
            .collection("courses")
            .findOne({ _id: new ObjectId(courseId) });

        // Free courses are accessible to everyone
        if (!course.isPremium) {
            return { hasAccess: true };
        }

        // Premium courses require purchased course_generation, UNLESS the user is already enrolled
        const hasCourseGen = hasPurchasedItem(user, "course_generation");
        
        // Check if user is already "enrolled" (exists in their courses array)
        const isEnrolled = user.courses?.some(c => 
            (c.courseId instanceof ObjectId ? c.courseId.equals(new ObjectId(courseId)) : c.courseId.toString() === courseId.toString())
        );

        if (isEnrolled) {
            return { hasAccess: true };
        }

        if (!hasCourseGen && !hasPaidPlan(user)) {
            return {
                hasAccess: false,
                reason: "Course generation purchase required",
                requiredTier: TIERS.PRO,
            };
        }

        return { hasAccess: true };
    } catch (error) {
        console.error("Error checking course access:", error);
        return { hasAccess: false, reason: "Internal server error" };
    }
}

/**
 * Map API name to feature name used in plan limits
 */
function getFeatureName(apiName) {
    if (apiName === "generate-course") return "generateCourseLimit";
    if (apiName === "generate-flashcards") return "flashcards";
    if (apiName === "quiz") return "quizGenerations";
    if (apiName === "ai-tutor-chat") return "aiResponses";
    if (apiName === "generate-report-outline" || apiName === "generate-report-section") return "reportGenerations";
    if (apiName === "career" || apiName === "career-skill-gap" || apiName === "career-interview" || apiName === "career-network" || apiName === "career-cover-letter") return "careerLimit";
    return apiName;
}

/**
 * Track API usage for rate limiting by plan tier.
 * Optionally deduct credits when user doesn't own the item type.
 * @param {string} userId
 * @param {string} apiName
 * @param {{ itemType: string, creditCost: number } | null} creditsConfig - if provided, deduct credits when user doesn't own the item
 */
export async function trackAPIUsage(userId, apiName, creditsConfig = null) {
    try {
        const { db } = await connectToDatabase();
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const featureName = getFeatureName(apiName);

        const result = await db.collection("api_usage").findOneAndUpdate(
            {
                userId: new ObjectId(userId),
                apiName: featureName,
                month: monthStart,
            },
            {
                $inc: { count: 1 },
                $set: { updatedAt: new Date() },
            },
            { upsert: true, returnDocument: "after" }
        );

        if (creditsConfig) {
            const { itemType, creditCost } = creditsConfig;
            const user = await db.collection("users").findOne(
                { _id: new ObjectId(userId) },
                { projection: { credits: 1, isPremium: 1, purchasedItems: 1 } }
            );

            if (user && !user.isPremium && !user.purchasedItems?.some(p => p.itemType === itemType)) {
                const available = user.credits || 0;
                if (available >= creditCost) {
                    await db.collection("users").updateOne(
                        { _id: new ObjectId(userId), credits: { $gte: creditCost } },
                        { $inc: { credits: -creditCost } }
                    );
                }
            }
        }

        return result?.count || 1;
    } catch (error) {
        console.error("Error tracking API usage:", error);
        return 0; // Fail open
    }
}

/**
 * Check if user has exceeded API limit
 */
export async function checkAPILimit(userId, apiName) {
    try {
        const user = await validateSubscriptionStatus(userId);
        if (!user) return { withinLimit: false, reason: "User not found" };

        const userTier = user.subscription?.tier || TIERS.FREE;

        const { db } = await connectToDatabase();
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Map apiName to feature name in planLimits FIRST
        const featureName = getFeatureName(apiName);

        const usageDoc = await db.collection("api_usage").findOne({
            userId: new ObjectId(userId),
            apiName: featureName,
            month: monthStart,
        });

        const currentUsage = usageDoc?.count || 0;

        // Get limits from central planLimits.js for consistency
        const { getUserPlanLimits } = await import("./planLimits");
        const planLimits = getUserPlanLimits(user);

        const tierLimit = planLimits[featureName] || planLimits[apiName] || 5;

        return {
            withinLimit: tierLimit === -1 || currentUsage < tierLimit,
            currentUsage,
            limit: tierLimit,
            remaining: tierLimit === -1 ? Infinity : Math.max(0, tierLimit - currentUsage),
            tier: userTier,
        };
    } catch (error) {
        console.error("Error checking API limit:", error);
        return { withinLimit: true, reason: "Error checking limit - failing open" };
    }
}

/**
 * Middleware wrapper for validating API limits
 */
export function withAPIRateLimit(handler, apiName) {
    return async (request, context) => {
        try {
            const user = request.user;
            if (!user) {
                // If auth is optional, allow request to pass without rate limiting
                return handler(request, context);
            }

            const limitCheck = await checkAPILimit(user._id, apiName);

            if (!limitCheck.withinLimit && limitCheck.limit !== -1) {
                return NextResponse.json(
                    {
                        error: "API rate limit exceeded",
                        message: `You have reached your monthly limit of ${limitCheck.limit} calls for ${apiName}.`,
                        tier: limitCheck.tier,
                        nextReset: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString(),
                        used: limitCheck.currentUsage,
                        limit: limitCheck.limit,
                    },
                    { status: 429 }
                );
            }

            // NOTE: Automatic increment removed. Handlers MUST call trackAPIUsage or incrementAPIUsage manually
            // only on successful completion of the expensive operation.

            const response = await handler(request, context);

            // Add usage headers (using current check-only status)
            if (response && response instanceof NextResponse) {
                response.headers.set("X-RateLimit-Limit", limitCheck.limit.toString());
                response.headers.set("X-RateLimit-Remaining", (limitCheck.remaining).toString());
                response.headers.set("X-RateLimit-Used", limitCheck.currentUsage.toString());
            }

            return response;
        } catch (error) {
            console.error(`Rate limit error in ${apiName}:`, error);
            throw error; // Re-throw the error instead of trying to call handler again
        }
    };
}

/**
 * Get current usage status without checking limits
 */
export async function getAPIUsageStatus(userId, apiName) {
    try {
        const { db } = await connectToDatabase();
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        const usageDoc = await db.collection("api_usage").findOne({
            userId: new ObjectId(userId),
            apiName,
            month: monthStart,
        });

        return usageDoc?.count || 0;
    } catch (error) {
        console.error("Error getting usage status:", error);
        return 0;
    }
}
