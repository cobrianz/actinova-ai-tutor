// src/app/api/signup/route.js

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword } from "@/lib/auth";
import { ObjectId } from "mongodb";
import crypto from 'crypto';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let { firstName, lastName, email, password, confirmPassword, acceptTerms } =
    body;

  // Sanitize inputs
  firstName = firstName?.trim();
  lastName = lastName?.trim();
  email = email?.toLowerCase().trim();
  password = password?.trim();
  confirmPassword = confirmPassword?.trim();

  // Basic validation
  if (!firstName || firstName.length < 2 || firstName.length > 50) {
    return NextResponse.json(
      { error: "First name must be 2–50 characters" },
      { status: 400 }
    );
  }
  if (!lastName || lastName.length < 2 || lastName.length > 50) {
    return NextResponse.json(
      { error: "Last name must be 2–50 characters" },
      { status: 400 }
    );
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  // Strong password validation
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  // Check password strength
  const passwordErrors = [];
  if (!/[a-z]/.test(password)) passwordErrors.push("lowercase letter");
  if (!/[A-Z]/.test(password)) passwordErrors.push("uppercase letter");
  if (!/\d/.test(password)) passwordErrors.push("number");
  if (!/[@$!%*?&]/.test(password)) passwordErrors.push("special character (@$!%*?&)");

  if (passwordErrors.length > 0) {
    return NextResponse.json(
      {
        error: "Password too weak",
        details: `Must contain: ${passwordErrors.join(", ")}`,
      },
      { status: 400 }
    );
  }
  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Passwords don't match" },
      { status: 400 }
    );
  }
  if (acceptTerms !== true) {
    return NextResponse.json(
      { error: "You must accept the terms" },
      { status: 400 }
    );
  }

  try {
    const { db } = await connectToDatabase();
    const usersCol = db.collection("users");

    // Check existing user
    const existing = await usersCol.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Generate verification token and code
    const verificationToken = crypto.randomUUID();
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString(); // 6-digit code
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Create user
    const user = {
      _id: new ObjectId(),
      name: `${firstName} ${lastName}`,
      email,
      password: await hashPassword(password),
      role: "student",
      status: "pending", // requires email verification
      emailVerificationToken: verificationToken,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: verificationExpires,
      monthlyUsage: 0,
      usageResetDate: new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        1
      ),
      streak: 0,
      totalLearningTime: 0,
      achievements: [],
      createdAt: new Date(),
      lastActive: new Date(),
    };

    await usersCol.insertOne(user);

    // Send verification email (fire-and-forget)
    try {
      const { sendVerificationEmail } = await import("@/lib/email");
      await sendVerificationEmail({
        to: user.email,
        name: user.name.split(" ")[0],
        token: verificationToken,
        code: verificationCode,
      });
    } catch (emailError) {
      console.error("[Signup] Failed to send verification email:", emailError);
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        requiresVerification: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          isPremium: false,
          usage: {
            used: 0,
            limit: 5,
            remaining: 5,
            percentage: 0,
            isPremium: false,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again later." },
      { status: 500 }
    );
  }
}