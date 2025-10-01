// src/app/api/refresh/route.js

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  verifyRefreshToken,
  generateTokenPair,
  sanitizeUser,
} from "@/lib/auth";
import { findUserById, removeRefreshToken } from "@/lib/db";
import { withErrorHandling, withCORS, withRateLimit } from "@/lib/middleware";

async function refreshHandler(req) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: "Refresh token not provided" },
      { status: 401 }
    );
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user from database
    const user = await findUserById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Check if user is active
    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Account is not active" },
        { status: 403 }
      );
    }

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } =
      generateTokenPair(user);

    // Remove old refresh token and add new one
    await removeRefreshToken(user._id, refreshToken);
    await addRefreshToken(user._id, newRefreshToken);

    // Set new cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    };

    cookieStore.set("token", accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60, // 1 hour
    });

    cookieStore.set("refreshToken", newRefreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({
      message: "Tokens refreshed successfully",
      user: sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    // Clear invalid refresh token
    cookieStore.delete("refreshToken", { path: "/" });

    return NextResponse.json(
      { error: "Invalid refresh token" },
      { status: 401 }
    );
  }
}

// Apply middleware
const rateLimitedHandler = withRateLimit({ max: 20, windowMs: 15 * 60 * 1000 })(
  refreshHandler
);
const corsHandler = withCORS()(rateLimitedHandler);
const errorHandledHandler = withErrorHandling(corsHandler);

export const POST = errorHandledHandler;


