// src/app/api/verify-reset-code/route.js

import { verifyResetCode } from "@/lib/db";
import { withErrorHandling, withRateLimit, withCORS } from "@/lib/middleware";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation schema
const verifyResetCodeSchema = z.object({
  email: z.string().email("Invalid email format"),
  code: z.string().length(6, "Code must be 6 digits"),
});

async function verifyResetCodeHandler(req) {
  const body = await req.json();
  console.log("Verify reset code request:", body);

  // Validate input
  try {
    const validatedData = verifyResetCodeSchema.parse(body);
    const { email, code } = validatedData;
    console.log("Validated data - email:", email, "code:", code);

    // Verify the reset code
    const user = await verifyResetCode(email, code);

    return NextResponse.json(
      {
        message: "Code verified successfully",
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
const rateLimitedHandler = withRateLimit({ max: 5, windowMs: 15 * 60 * 1000 })(
  verifyResetCodeHandler
);
const corsHandler = withCORS()(rateLimitedHandler);
const errorHandledHandler = withErrorHandling(corsHandler);

export const POST = errorHandledHandler;