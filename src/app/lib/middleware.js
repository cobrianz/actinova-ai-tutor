// src/app/lib/middleware.js

import { NextResponse } from "next/server";
import { verifyToken } from "./auth";
import { findUserById } from "./db";

// Authentication middleware
export function withAuth(handler, options = {}) {
  return async (req, context) => {
    try {
      const token =
        req.cookies?.get("token")?.value ||
        req.headers?.get("authorization")?.replace("Bearer ", "");

      if (!token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      // Verify token
      const decoded = verifyToken(token);

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

      // Check if account is locked
      if (user.isLocked) {
        return NextResponse.json(
          { error: "Account is temporarily locked" },
          { status: 423 }
        );
      }

      // Add user to request context
      req.user = user;

      // Check role-based access
      if (options.roles && !options.roles.includes(user.role)) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }

      return handler(req, context);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
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

      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV === "development";

      return NextResponse.json(
        {
          error: "Internal server error",
          message: isDevelopment ? error.message : "Something went wrong",
          ...(isDevelopment && { stack: error.stack }),
        },
        { status: 500 }
      );
    }
  };
}

// Combine multiple middleware
export function combineMiddleware(...middlewares) {
  return middlewares.reduce((acc, middleware) => {
    return middleware(acc);
  });
}
