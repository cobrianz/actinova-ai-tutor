// src/app/api/usage/route.js

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    // Extract user from auth middleware (your existing withAuth sets req.user)
    const authHeader = request.headers.get("authorization");
    let token = authHeader?.startsWith("Bearer ")
      ? authHeader.split("Bearer ")[1]
      : null;

    let userId = null;
    const { verifyToken } = await import("@/lib/auth");

    if (token) {
      try {
        const payload = verifyToken(token);
        if (payload?.id) {
          userId = new ObjectId(payload.id);
        }
      } catch (error) {
        // Header token invalid, try cookie
        const cookieHeader = request.headers.get("cookie");
        if (cookieHeader) {
          const cookies = cookieHeader.split("; ").reduce((acc, cookie) => {
            const [key, value] = cookie.split("=");
            acc[key] = value;
            return acc;
          }, {});
          token = cookies.token;
          if (token) {
            try {
              const payload = verifyToken(token);
              if (payload?.id) {
                userId = new ObjectId(payload.id);
              }
            } catch (cookieError) {
              // Cookie token also invalid
            }
          }
        }
      }
    } else {
      // No header, check cookie
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const cookies = cookieHeader.split("; ").reduce((acc, cookie) => {
          const [key, value] = cookie.split("=");
          acc[key] = value;
          return acc;
        }, {});
        token = cookies.token;
        if (token) {
          try {
            const payload = verifyToken(token);
            if (payload?.id) {
              userId = new ObjectId(payload.id);
            }
          } catch (error) {
            // Cookie token invalid
          }
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const usersCol = db.collection("users");

    const user = await usersCol.findOne(
      { _id: userId },
      {
        projection: {
          monthlyUsage: 1,
          isPremium: 1,
          "subscription.plan": 1,
          "subscription.status": 1,
        },
      }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [courseUsed, cardSetUsed, quizUsed, reportUsed, chatUsed] = await Promise.all([
      db.collection("library").countDocuments({ userId, format: "course", createdAt: { $gte: startOfMonth } }),
      db.collection("cardSets").countDocuments({ userId, createdAt: { $gte: startOfMonth } }),
      db.collection("tests").countDocuments({ createdBy: userId, createdAt: { $gte: startOfMonth } }),
      db.collection("reports").countDocuments({ userId, createdAt: { $gte: startOfMonth } }),
      db.collection("chats").countDocuments({ userId, createdAt: { $gte: startOfMonth } }),
    ]);

    const isPremium =
      user.isPremium === true ||
      (user.subscription?.plan === "pro" &&
        user.subscription?.status === "active");

    const isEnterprise =
      user.subscription?.plan === "enterprise" &&
      user.subscription?.status === "active";

    const limits = {
      courses: isEnterprise ? Infinity : (isPremium ? 20 : 2),
      flashcards: isEnterprise ? Infinity : (isPremium ? 30 : 5),
      quizzes: isEnterprise ? Infinity : (isPremium ? 30 : 2),
      reports: isEnterprise ? Infinity : (isPremium ? 50 : 3),
      chat: isEnterprise ? Infinity : (isPremium ? 1000 : 20)
    };

    const coursePercent = Math.min(100, Math.round((courseUsed / (limits.courses === Infinity ? (courseUsed + 1) : limits.courses)) * 100));
    const cardPercent = Math.min(100, Math.round((cardSetUsed / (limits.flashcards === Infinity ? (cardSetUsed + 1) : limits.flashcards)) * 100));
    const quizPercent = Math.min(100, Math.round((quizUsed / (limits.quizzes === Infinity ? (quizUsed + 1) : limits.quizzes)) * 100));
    const reportPercent = Math.min(100, Math.round((reportUsed / (limits.reports === Infinity ? (reportUsed + 1) : limits.reports)) * 100));
    const chatPercent = Math.min(100, Math.round((chatUsed / (limits.chat === Infinity ? (chatUsed + 1) : limits.chat)) * 100));

    // For the global bar, show the highest percentage to warn the user
    const maxPercent = Math.max(coursePercent, cardPercent, quizPercent, reportPercent, chatPercent);
    const totalUsed = courseUsed + cardSetUsed + quizUsed + reportUsed + chatUsed;
    const totalLimit = limits.courses + limits.flashcards + limits.quizzes + limits.reports + limits.chat;

    const usage = {
      used: totalUsed,
      limit: totalLimit === Infinity ? null : totalLimit,
      remaining: totalLimit === Infinity ? null : Math.max(0, totalLimit - totalUsed),
      percentage: isEnterprise ? 0 : maxPercent, // Use max percent for UI feedback, enterprise is always 0% used
      details: {
        courses: { used: courseUsed, limit: limits.courses, percent: isEnterprise ? 0 : coursePercent },
        flashcards: { used: cardSetUsed, limit: limits.flashcards, percent: isEnterprise ? 0 : cardPercent },
        quizzes: { used: quizUsed, limit: limits.quizzes, percent: isEnterprise ? 0 : quizPercent },
        reports: { used: reportUsed, limit: limits.reports, percent: isEnterprise ? 0 : reportPercent },
        chat: { used: chatUsed, limit: limits.chat, percent: isEnterprise ? 0 : chatPercent }
      },
      isNearLimit: !isEnterprise && maxPercent >= 80,
      isAtLimit: !isEnterprise && maxPercent >= 100,
      isPremium,
      isEnterprise,
      resetsAt: new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        1
      ).toISOString(),
    };

    return NextResponse.json(usage, { status: 200 });
  } catch (error) {
    console.error("[/api/usage] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
