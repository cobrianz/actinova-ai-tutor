// src/app/lib/middleware.js

import { NextResponse } from "next/server";
import { verifyToken } from "./auth";
import { findUserById } from "./db";
import { connectToDatabase } from "./mongodb";
import { ObjectId } from "mongodb";
import { cookies as nextCookies, headers as nextHeaders } from "next/headers";

// Authentication middleware
export function withAuth(handler, options = {}) {
  return async (req, context) => {
    try {
      // Helper: safe, non-PII debug for auth failures
      const safeAuthDebug = async (req, reason) => {
        try {
          const url = req.url || (req.headers && req.headers.get && req.headers.get("x-original-url")) || "unknown";
          if (!url.includes("/api/course-progress") && !url.includes("/api/library")) return;

          const headers = {};
          for (const [k, v] of req.headers.entries ? req.headers.entries() : []) {
            const key = k.toLowerCase();
            if (["authorization", "cookie", "set-cookie"].includes(key)) {
              headers[key] = v ? "[REDACTED_PRESENT]" : "[MISSING]";
            } else {
              headers[key] = typeof v === "string" ? (v.length > 100 ? v.slice(0, 100) + "..." : v) : typeof v;
            }
          }

          console.warn("Auth failure debug:", { url, reason, headers });
        } catch (e) { }
      };

      let token = null;
      token = req.cookies?.get?.("token")?.value || null;

      if (!token) {
        try {
          token = nextCookies().get("token")?.value || null;
        } catch (e) { }
      }

      if (!token) {
        token = req.headers?.get("authorization")?.replace("Bearer ", "") ||
          nextHeaders()?.get("authorization")?.replace?.("Bearer ", "") || null;
      }

      let userId = null;

      if (token) {
        try {
          const decoded = verifyToken(token);
          userId = decoded.id;
        } catch (err) {
          // Token invalid, attempt x-user-id fallback below
        }
      }

      if (!userId) {
        userId = req.headers?.get?.("x-user-id");
      }

      if (!userId) {
        await safeAuthDebug(req, "no-user-id-found");
        return NextResponse.json({ error: "Authentication required", code: "AUTH_REQUIRED" }, { status: 401 });
      }

      // Import plan validation to handle auto-downgrade on EVERY auth check
      const { validateSubscriptionStatus } = await import("./planMiddleware");
      const user = await validateSubscriptionStatus(userId);

      if (!user) {
        await safeAuthDebug(req, "user-not-found");
        return NextResponse.json({ error: "User not found", code: "USER_NOT_FOUND" }, { status: 401 });
      }

      if (user.status !== "active") {
        return NextResponse.json({ error: "Account is not active", code: "ACCOUNT_INACTIVE" }, { status: 403 });
      }

      if (user.isLocked) {
        return NextResponse.json({ error: "Account is temporarily locked", code: "ACCOUNT_LOCKED" }, { status: 423 });
      }

      // Add user to request context
      req.user = user;

      // Check role-based access
      if (options.roles && !options.roles.includes(user.role)) {
        return NextResponse.json({ error: "Insufficient permissions", code: "FORBIDDEN" }, { status: 403 });
      }

      return handler(req, context);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return NextResponse.json({ error: "Authentication error", code: "AUTH_ERROR" }, { status: 401 });
    }
  };
}


// Rate limiting middleware
const rateLimitMap = new Map();

export function withRateLimit(options = {}) {
  const maxRequests = options.max || 100;
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes

  return (handler) => {
    return async (req, context) => {
      const ip =
        req.headers?.get("x-forwarded-for") ||
        req.headers?.get("x-real-ip") ||
        "unknown";

      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean up old entries
      for (const [key, data] of rateLimitMap.entries()) {
        if (data.timestamp < windowStart) {
          rateLimitMap.delete(key);
        }
      }

      // Check current rate
      const current = rateLimitMap.get(ip) || { count: 0, timestamp: now };

      if (current.timestamp < windowStart) {
        current.count = 0;
        current.timestamp = now;
      }

      if (current.count >= maxRequests) {
        return NextResponse.json(
          { error: "Too many requests" },
          {
            status: 429,
            headers: {
              "Retry-After": Math.ceil(windowMs / 1000),
            },
          }
        );
      }

      current.count++;
      rateLimitMap.set(ip, current);

      return handler(req, context);
    };
  };
}

// CORS middleware
export function withCORS(options = {}) {
  const allowedOrigins = options.origins || [
    process.env.CORS_ORIGIN || "http://localhost:3000",
  ];
  const allowedMethods = options.methods || [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "OPTIONS",
  ];
  const allowedHeaders = options.headers || ["Content-Type", "Authorization"];

  return (handler) => {
    return async (req, context) => {
      const origin = req.headers?.get("origin");
      const isAllowedOrigin = allowedOrigins.includes(origin);

      // Handle preflight requests
      if (req.method === "OPTIONS") {
        return new NextResponse(null, {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": isAllowedOrigin
              ? origin
              : allowedOrigins[0],
            "Access-Control-Allow-Methods": allowedMethods.join(", "),
            "Access-Control-Allow-Headers": allowedHeaders.join(", "),
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
          },
        });
      }

      const response = await handler(req, context);

      // Add CORS headers to response
      if (response) {
        response.headers.set(
          "Access-Control-Allow-Origin",
          isAllowedOrigin ? origin : allowedOrigins[0]
        );
        response.headers.set("Access-Control-Allow-Credentials", "true");
      }

      return response;
    };
  };
}

// Validation middleware
export function withValidation(schema) {
  return (handler) => {
    return async (req, context) => {
      try {
        const body = await req.json();
        const validatedData = schema.parse(body);
        req.validatedData = validatedData;
        return handler(req, context);
      } catch (error) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: error.errors || error.message,
          },
          { status: 400 }
        );
      }
    };
  };
}

// Error handling middleware
export function withErrorHandling(handler) {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error("API Error:", error);

      const isDevelopment = process.env.NODE_ENV === "development";

      // Standardized error response
      return NextResponse.json(
        {
          error: "Internal server error",
          message: isDevelopment ? error.message : "Something went wrong. Please try again later.",
          code: error.code || "INTERNAL_SERVER_ERROR",
          status: error.status || 500,
          ...(isDevelopment && { stack: error.stack }),
        },
        { status: error.status || 500 }
      );
    }
  };
}


// Combine multiple middleware
export function combineMiddleware(...middlewares) {
  return middlewares.reduceRight((acc, middleware) => {
    return middleware(acc);
  });
}
