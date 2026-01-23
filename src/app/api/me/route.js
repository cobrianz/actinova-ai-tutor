import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { getAuth, clerkClient } from "@clerk/nextjs/server";

export async function GET(request) {
  let localToken = null;
  let clerkUserId = null;

  // 1. Check Clerk session
  try {
    const authData = getAuth(request);
    clerkUserId = authData?.userId;
  } catch (e) {
    // Fail silently, maybe Clerk isn't configured or this isn't a Clerk request
  }

  // 2. Check local token
  const authHeader = (await headers()).get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    localToken = authHeader.slice(7);
  } else {
    localToken = (await cookies()).get("token")?.value;
  }

  if (!localToken && !clerkUserId) {
    return NextResponse.json({ user: null });
  }

  try {
    const { db } = await connectToDatabase();
    const usersCol = db.collection("users");
    let query = null;

    // Use local token if valid
    if (localToken) {
      try {
        const decoded = verifyToken(localToken);
        if (decoded?.id) {
          query = { _id: new ObjectId(decoded.id) };
        }
      } catch (err) {
        // Token invalid, but maybe we have a Clerk session?
      }
    }

    // Fallback to Clerk session if local token failed or wasn't provided
    if (!query && clerkUserId) {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkUserId);
      const email = clerkUser.emailAddresses[0]?.emailAddress;

      if (!email) return NextResponse.json({ user: null });

      const existingUser = await usersCol.findOne({ email });
      if (existingUser) {
        query = { _id: existingUser._id };
        if (!existingUser.clerkId) {
          await usersCol.updateOne({ _id: existingUser._id }, { $set: { clerkId: clerkUserId } });
        }
      } else {
        const newUser = {
          _id: new ObjectId(),
          clerkId: clerkUserId,
          email,
          name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim() : email.split("@")[0],
          avatar: clerkUser.imageUrl,
          status: "active",
          emailVerified: true,
          onboardingCompleted: false,
          monthlyUsage: 0,
          usageResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          createdAt: new Date(),
          lastActive: new Date(),
        };
        await usersCol.insertOne(newUser);
        query = { _id: newUser._id };
      }
    }

    if (!query) {
      return NextResponse.json({ user: null });
    }

    const user = await usersCol.findOne(
      query,
      {
        projection: {
          password: 0,
          refreshTokens: 0,
          "profile.bio": 0,
          courses: 0,
          timeCommitment: 0,
        },
      }
    );

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
