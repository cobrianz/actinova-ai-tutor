// src/app/api/usage/route.js

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getTrackedUsageSummary } from "@/lib/usageSummary";
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

    const usage = await getTrackedUsageSummary(db, {
      ...user,
      _id: userId,
    });

    return NextResponse.json(usage, { status: 200 });
  } catch (error) {
    console.error("[/api/usage] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
