// src/app/api/logout/route.js

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { removeAllRefreshTokens } from "@/lib/db";
import { withErrorHandling, withCORS } from "@/lib/middleware";

async function logoutHandler(req) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  // Clear cookies
  cookieStore.delete("token", { path: "/" });
  cookieStore.delete("refreshToken", { path: "/" });

  // If we have a refresh token, remove it from database
  if (refreshToken) {
    try {
      const { verifyRefreshToken } = await import("@/lib/auth");
      const decoded = verifyRefreshToken(refreshToken);
      await removeAllRefreshTokens(decoded.id);
    } catch (error) {
      // Token might be invalid, but we still want to clear cookies
      console.error("Error removing refresh token:", error);
    }
  }

  return NextResponse.json({
    message: "Logged out successfully",
  });
}

// Apply middleware
const corsHandler = withCORS()(logoutHandler);
const errorHandledHandler = withErrorHandling(corsHandler);

export const POST = errorHandledHandler;
