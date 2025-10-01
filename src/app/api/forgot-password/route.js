// src/app/api/forgot-password/route.js

import { findUserByEmail, setPasswordResetCode } from "@/lib/db";
import { sendPasswordResetCodeEmail } from "@/lib/email-nodemailer";
import { withErrorHandling, withRateLimit, withCORS } from "@/lib/middleware";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

async function forgotPasswordHandler(req) {
  const body = await req.json();

  // Validate input
  try {
    const validatedData = forgotPasswordSchema.parse(body);
    const { email } = validatedData;

    // Check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        {
          message:
            "If an account with that email exists, we've sent a password reset link.",
        },
        { status: 200 }
      );
    }

    // Check if user is active
    if (user.status !== "active") {
      // In development mode, include the code in the response for testing
      const isDevelopment = !process.env.SMTP_USER || !process.env.SMTP_PASS;
      const response = {
        message: isDevelopment
          ? `Reset code sent. Check server console for code: ${resetCode}`
          : "If an account with that email exists, we've sent a password reset code.",
      };
  
      if (isDevelopment) {
        response.code = resetCode; // Only in development
      }
  
      return NextResponse.json(response, { status: 200 });
    }

    // Generate and set password reset code
    const resetCode = await setPasswordResetCode(email);
    console.log("Generated reset code:", resetCode, "for email:", email);

    // Send password reset email
    try {
      const emailResult = await sendPasswordResetCodeEmail(
        user.email,
        user.firstName,
        resetCode
      );
      console.log("Email send result:", emailResult);

      if (!emailResult.success) {
        console.warn("Failed to send password reset email:", emailResult.error);
        // Don't reveal email sending failure to user for security
      }
    } catch (emailError) {
      console.warn("Email sending error:", emailError);
      // Don't reveal email sending failure to user for security
    }

    return NextResponse.json(
      {
        message:
          "If an account with that email exists, we've sent a password reset link.",
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
    throw error;
  }
}

// Apply middleware
const rateLimitedHandler = withRateLimit({ max: 3, windowMs: 15 * 60 * 1000 })(
  forgotPasswordHandler
);
const corsHandler = withCORS()(rateLimitedHandler);
const errorHandledHandler = withErrorHandling(corsHandler);

export const POST = errorHandledHandler;
