// src/app/api/change-password/route.js

import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { findUserById, updateUser } from "@/lib/db";
import { withErrorHandling, withCORS } from "@/lib/middleware";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Validation schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
});

async function changePasswordHandler(req) {
  const body = await req.json();

  // Validate input
  try {
    const validatedData = changePasswordSchema.parse(body);
    const { currentPassword, newPassword, confirmPassword } = validatedData;

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New password and confirm password do not match" },
        { status: 400 }
      );
    }

    // Additional password validation
    const passwordErrors = [];
    if (newPassword.length < 8) {
      passwordErrors.push("Password must be at least 8 characters long");
    }
    if (!/(?=.*[a-z])/.test(newPassword)) {
      passwordErrors.push("Password must contain at least one lowercase letter");
    }
    if (!/(?=.*[A-Z])/.test(newPassword)) {
      passwordErrors.push("Password must contain at least one uppercase letter");
    }
    if (!/(?=.*\d)/.test(newPassword)) {
      passwordErrors.push("Password must contain at least one number");
    }
    if (!/(?=.*[@$!%*?&])/.test(newPassword)) {
      passwordErrors.push("Password must contain at least one special character (@$!%*?&)");
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

    // Get user from token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const user = await findUserById(decoded.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Update password
    await updateUser(user._id, { password: newPassword });

    return NextResponse.json(
      { message: "Password changed successfully" },
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
const corsHandler = withCORS()(changePasswordHandler);
const errorHandledHandler = withErrorHandling(corsHandler);

export const POST = errorHandledHandler;
