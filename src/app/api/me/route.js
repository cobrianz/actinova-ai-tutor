// src/app/api/me/route.js

import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { withErrorHandling, withCORS } from "@/lib/middleware";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

async function meHandler(req) {
  // Try to get token from authorization header first, then from cookies
  const authHeader = req.headers.get('authorization');
  let token = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    const cookieStore = cookies();
    token = cookieStore.get("token")?.value;
  }

  console.log("/api/me - token present:", !!token);

  if (!token) {
    console.log("/api/me - no token");
    return NextResponse.json({ user: null });
  }

  try {
    const decoded = verifyToken(token);
    console.log("/api/me - decoded token:", decoded);

    const { db } = await connectToDatabase();
    const usersCol = db.collection('users');
    
    const user = await usersCol.findOne({ _id: new ObjectId(decoded.id) });
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

    // Sanitize user data (remove sensitive fields)
    const { password, refreshTokens, ...sanitizedUser } = user;
    
    console.log("/api/me - returning user");
    return NextResponse.json({
      user: sanitizedUser,
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