import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(request) {
  let localToken = null;

  // 1. Check local token
  const authHeader = (await headers()).get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    localToken = authHeader.slice(7);
  } else {
    localToken = (await cookies()).get("token")?.value;
  }

  if (!localToken) {
    return NextResponse.json({ user: null });
  }

  try {
    const { db } = await connectToDatabase();
    const usersCol = db.collection("users");
    let query = null;

    // Use local token
    try {
      const decoded = verifyToken(localToken);
      if (decoded?.id) {
        query = { _id: new ObjectId(decoded.id) };
      }
    } catch (err) {
      return NextResponse.json({ user: null });
    }

    if (!query) {
      return NextResponse.json({ user: null });
    }

    // Use validateSubscriptionStatus to ensure auto-downgrade logic runs
    const { validateSubscriptionStatus } = await import("@/lib/planMiddleware");
    const userId = query._id.toString();
    const user = await validateSubscriptionStatus(userId);

    // If validatedUser confirms user exists, we proceed. 
    // Note: The previous projection is replaced by selecting fields for 'safeUser' later.

    if (!user || user.status !== "active") {
      return NextResponse.json({ user: null });
    }

    // Auto-reset monthly usage if new month
    const now = new Date();
    const lastReset = user.usageResetDate ? new Date(user.usageResetDate) : null;
    const isNewMonth = !lastReset ||
      lastReset.getMonth() !== now.getMonth() ||
      lastReset.getFullYear() !== now.getFullYear();

    let monthlyUsage = user.monthlyUsage || 0;
    if (isNewMonth) {
      monthlyUsage = 0;
      await usersCol.updateOne(
        { _id: user._id },
        {
          $set: {
            monthlyUsage: 0,
            usageResetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          },
        }
      );
    }

    const { getUserPlanLimits } = await import("@/lib/planLimits");
    const limits = getUserPlanLimits(user);
    const isPremium = user.isPremium ||
      (user.subscription?.plan === "premium" && user.subscription?.status === "active");

    const usage = {
      used: monthlyUsage,
      limit: limits.courses,
      remaining: Math.max(0, limits.courses - monthlyUsage),
      percentage: Math.round((monthlyUsage / limits.courses) * 100),
      isPremium,
      resetsOn: new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };

    const safeUser = {
      id: user._id.toString(),
      name: user.name || user.email.split("@")[0],
      email: user.email,
      avatar: user.avatar || null,
      streak: user.streak || 0,
      totalLearningTime: user.totalLearningTime || 0,
      achievements: user.achievements || [],
      emailVerified: user.emailVerified || false,
      status: user.status,
      onboardingCompleted: user.onboardingCompleted || false,
      isPremium,
      subscription: user.subscription,
      usage,
    };

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error("/api/me error:", error);
    return NextResponse.json({ user: null });
  }
}
