// src/app/api/signup/route.js

import { createUser, findUserByEmail } from "@/lib/db";
import { validateEmail, validatePassword, sanitizeUser } from "@/lib/auth";
import { withErrorHandling, withRateLimit, withCORS } from "@/lib/middleware";
import { sendVerificationEmail } from "@/lib/email-nodemailer";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation schema
const signupSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name too long"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name too long"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    // role removed from input – we’ll force it to student later
    acceptTerms: z.coerce
      .boolean()
      .refine(
        (val) => val === true,
        "You must accept the terms and conditions"
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

async function signupHandler(req) {
  const body = await req.json();

  // Validate input
  try {
    const validatedData = signupSchema.parse(body);
    const { firstName, lastName, email, password } = validatedData;

    // Additional validation
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: "Password does not meet requirements",
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Force role to "student"
    const role = "student";

    // Create user
    const user = await createUser({
      firstName,
      lastName,
      email,
      password,
      role,
    });

    // Send email verification
    try {
      const emailResult = await sendVerificationEmail(
        user.email,
        user.firstName,
        user.emailVerificationToken
      );

      if (!emailResult.success) {
        console.warn("Failed to send verification email:", emailResult.error);
        // Don't fail the signup if email fails, just log it
      }
    } catch (emailError) {
      console.warn("Email sending error:", emailError);
      // Don't fail the signup if email fails
    }

    return NextResponse.json(
      {
        message:
          "Account created successfully! Please check your email to verify your account.",
        user: sanitizeUser(user),
        requiresVerification: true,
      },
      { status: 201 }
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
const rateLimitedHandler = withRateLimit({ max: 5, windowMs: 15 * 60 * 1000 })(
  signupHandler
);
const corsHandler = withCORS()(rateLimitedHandler);
const errorHandledHandler = withErrorHandling(corsHandler);

export const POST = errorHandledHandler;
