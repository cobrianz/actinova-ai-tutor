// src/app/api/protected/route.js

import { NextResponse } from "next/server";
import { withAuth, withErrorHandling, withCORS } from "@/lib/middleware";

async function protectedHandler(req) {
  // This route is protected by the withAuth middleware
  // The user object is available in req.user

  return NextResponse.json({
    message: "This is a protected route",
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
    },
    timestamp: new Date().toISOString(),
  });
}

// Apply middleware with authentication required
const authHandler = withAuth(protectedHandler, {
  roles: ["student", "instructor", "admin"],
});
const corsHandler = withCORS()(authHandler);
const errorHandledHandler = withErrorHandling(corsHandler);

export const GET = errorHandledHandler;
export const POST = errorHandledHandler;

