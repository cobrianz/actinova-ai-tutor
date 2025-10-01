// src/app/api/verify-email/route.js

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyEmail, addRefreshToken, updateLastLogin } from "@/lib/db";
import { generateTokenPair, sanitizeUser } from "@/lib/auth";
import { withErrorHandling, withCORS, withRateLimit } from "@/lib/middleware";
import { z } from "zod";

// Validation schema
const verifyEmailSchema = z.object({
  code: z.string().min(6, "Verification code must be 6 digits").max(6, "Verification code must be 6 digits"),
});

async function verifyEmailHandler(req) {
  const body = await req.json();
  const { code } = verifyEmailSchema.parse(body);

  try {
    // Verify email
    const user = await verifyEmail(code);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user);

    // Add refresh token to database
    await addRefreshToken(user._id, refreshToken);

    // Update last login
    await updateLastLogin(user._id);

    // Set cookies
    const cookieStore = await cookies();
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

    cookieStore.set("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({
      message: "Email verified successfully. You are now logged in.",
      user: sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    if (error.message === "Invalid or expired verification token") {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    console.error("Verify email error:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}

// Apply middleware
const rateLimitedHandler = withRateLimit({ max: 10, windowMs: 15 * 60 * 1000 })(
  verifyEmailHandler
);
const corsHandler = withCORS()(rateLimitedHandler);
const errorHandledHandler = withErrorHandling(corsHandler);

export const POST = errorHandledHandler;


