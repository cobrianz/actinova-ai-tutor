// src/app/api/me/route.js

import { cookies } from "next/headers";
import { verifyToken, sanitizeUser } from "@/lib/auth";
import { findUserById } from "@/lib/db";
import { withErrorHandling, withCORS } from "@/lib/middleware";
import { NextResponse } from "next/server";

async function meHandler(req) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  console.log("/api/me - token present:", !!token);

  if (!token) {
    console.log("/api/me - no token");
    return NextResponse.json({ user: null });
  }

  try {
    const decoded = verifyToken(token);
    console.log("/api/me - decoded token:", decoded);

    const user = await findUserById(decoded.id);
    console.log("/api/me - user found:", !!user);

    if (!user) {
      console.log("/api/me - user not found");
      return NextResponse.json({ user: null });
    }

    // Check if user is active
    console.log("/api/me - user status:", user.status);
    if (user.status !== "active") {
      console.log("/api/me - user not active");
      return NextResponse.json({ user: null });
    }

    console.log("/api/me - returning user");
    return NextResponse.json({
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("/me error:", err);
    return NextResponse.json({ user: null });
  }
}

// Apply middleware
const corsHandler = withCORS()(meHandler);
const errorHandledHandler = withErrorHandling(corsHandler);

export const GET = errorHandledHandler;
