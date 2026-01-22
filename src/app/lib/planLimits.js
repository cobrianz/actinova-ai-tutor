// src/app/lib/planLimits.js
// Centralized plan limits and enforcement

/**
 * Standard Tier Constants (synchronized with planMiddleware.js)
 */
export const TIERS = {
    FREE: "free",
    PRO: "pro",
    ENTERPRISE: "enterprise",
};

/**
 * Get user's current plan limits
 * @param {Object} user - User object with subscription info
 * @returns {Object} Plan limits
 */
export function getUserPlanLimits(user) {
    if (!user) {
        return getFreeLimits();
    }

    const subscription = user.subscription;
    const tier = subscription?.tier || (user.isPremium ? TIERS.PRO : TIERS.FREE);

    if (tier === TIERS.ENTERPRISE) {
        return getEnterpriseLimits();
    }

    if (tier === TIERS.PRO) {
        return getProLimits();
    }

    return getFreeLimits();
}

/**
 * Check if user has reached their limit for a specific feature
 */
export function checkLimit(user, feature, currentUsage) {
    const limits = getUserPlanLimits(user);
    const limit = limits[feature];

    // -1 means unlimited
    if (limit === -1) {
        return {
            allowed: true,
            limit: -1,
            remaining: -1,
            isUnlimited: true,
        };
    }

    const remaining = Math.max(0, limit - currentUsage);
    const allowed = currentUsage < limit;

    return {
        allowed,
        limit,
        remaining,
        isUnlimited: false,
    };
}

/**
 * Get plan name from user
 */
export function getUserPlanName(user) {
    if (!user) return 'Free';
    const tier = user.subscription?.tier || (user.isPremium ? TIERS.PRO : TIERS.FREE);
    return tier.charAt(0).toUpperCase() + tier.slice(1);
}

// Plan limit definitions
function getFreeLimits() {
    return {
        courses: 2,
        quizzes: 1,
        flashcards: 8,
        modules: 3,
        lessonsPerModule: 3,
        totalLessons: 9,
        difficulties: ['beginner'],
        aiResponses: 3, // per day
        generateCourseLimit: 5, // per month
    };
}

function getProLimits() {
    return {
        courses: 15,
        quizzes: 20,
        flashcards: 40,
        modules: 20,
        lessonsPerModule: 5,
        totalLessons: 100,
        difficulties: ['beginner', 'intermediate', 'advanced'],
        aiResponses: -1, // unlimited
        generateCourseLimit: 50, // per month
    };
}

function getEnterpriseLimits() {
    return {
        courses: -1, // unlimited
        quizzes: -1, // unlimited
        flashcards: -1, // unlimited
        modules: 20,
        lessonsPerModule: 5,
        totalLessons: 100,
        difficulties: ['beginner', 'intermediate', 'advanced'],
        aiResponses: -1, // unlimited
        generateCourseLimit: -1, // unlimited
    };
}

/**
 * Format limit for display
 */
export function formatLimit(limit) {
    return limit === -1 ? 'Unlimited' : limit.toString();
}

/**
 * Check if user can access difficulty level
 */
export function canAccessDifficulty(user, difficulty) {
    const limits = getUserPlanLimits(user);
    return limits.difficulties.includes(difficulty.toLowerCase());
}

