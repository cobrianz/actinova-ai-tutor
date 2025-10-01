// src/app/api/validate-reset-token/route.js

import { NextResponse } from "next/server";
import User from "@/models/User";
import connectToMongoose from "@/lib/mongoose";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Reset token is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectToMongoose();

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Reset token is valid",
        email: user.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error validating reset token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
