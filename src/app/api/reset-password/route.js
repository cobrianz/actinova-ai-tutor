// src/app/api/reset-password/route.js

import { resetPasswordWithCode } from "@/lib/db";
import { withErrorHandling, withRateLimit, withCORS } from "@/lib/middleware";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation schema
const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  code: z.string().length(6, "Code must be 6 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

async function resetPasswordHandler(req) {
  const body = await req.json();

  // Validate input
  try {
    const validatedData = resetPasswordSchema.parse(body);
    const { email, code, password } = validatedData;

    // Additional password validation
    const passwordErrors = [];
    if (password.length < 8) {
      passwordErrors.push("Password must be at least 8 characters long");
    }
    if (!/(?=.*[a-z])/.test(password)) {
      passwordErrors.push(
        "Password must contain at least one lowercase letter"
      );
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      passwordErrors.push(
        "Password must contain at least one uppercase letter"
      );
    }
    if (!/(?=.*\d)/.test(password)) {
      passwordErrors.push("Password must contain at least one number");
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      passwordErrors.push(
        "Password must contain at least one special character (@$!%*?&)"
      );
    }

    if (passwordErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Password does not meet requirements",
          details: passwordErrors,
        },
        { status: 400 }
      );
    }

    // Reset password
    const user = await resetPasswordWithCode(email, code, password);

    return NextResponse.json(
      {
        message:
          "Password has been reset successfully. You can now sign in with your new password.",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error.name === "ZodError") {
      console.error("Validation error details:", error.errors);
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error.message === "Invalid or expired reset code") {
      return NextResponse.json(
        { error: "Invalid or expired reset code" },
        { status: 400 }
      );
    }

    throw error;
  }
}

// Apply middleware
const rateLimitedHandler = withRateLimit({ max: 5, windowMs: 15 * 60 * 1000 })(
  resetPasswordHandler
);
const corsHandler = withCORS()(rateLimitedHandler);
const errorHandledHandler = withErrorHandling(corsHandler);

export const POST = errorHandledHandler;
