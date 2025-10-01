// src/app/api/login/route.js

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findUserByEmail, updateLastLogin, addRefreshToken } from "@/lib/db";
import { verifyPassword, generateTokenPair, sanitizeUser } from "@/lib/auth";
import { withErrorHandling, withRateLimit, withCORS } from "@/lib/middleware";
import { z } from "zod";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

async function loginHandler(req) {
  const body = await req.json();

  // Validate input
  try {
    const { email, password, rememberMe } = loginSchema.parse(body);

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (user.isLocked) {
      return NextResponse.json(
        {
          error:
            "Account is temporarily locked due to too many failed login attempts",
        },
        { status: 423 }
      );
    }

    // Check if account is active
    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Account is not active. Please verify your email first." },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      // Increment login attempts
      await user.incLoginAttempts();

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user, {
      expiresIn: rememberMe ? "30d" : "1h",
    });

    // Add refresh token to database
    await addRefreshToken(user._id, refreshToken);

    // Update last login
    await updateLastLogin(user._id);

    // Set cookies
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: process.env.NODE_ENV === "production",
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : undefined,
      path: "/",
    };

    cookieStore.set("token", accessToken, {
      ...cookieOptions,
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60, // 30 days or 1 hour
    });

    cookieStore.set("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({
      message: "Login successful",
      user: sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }
    throw error;
  }
}

// Apply middleware
const rateLimitedHandler = withRateLimit({ max: 10, windowMs: 15 * 60 * 1000 })(
  loginHandler
);
const corsHandler = withCORS()(rateLimitedHandler);
const errorHandledHandler = withErrorHandling(corsHandler);

export const POST = errorHandledHandler;
