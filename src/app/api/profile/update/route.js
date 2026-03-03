import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth, withErrorHandling, combineMiddleware } from "@/lib/middleware";
import { withCsrf } from "@/lib/withCsrf";

function calculateUsage(user) {
  const monthlyUsage = user.monthlyUsage || 0;
  const isPremium =
    user.isPremium ||
    (user.subscription?.plan === "pro" &&
      user.subscription?.status === "active");

  const limit = isPremium ? 15 : 2;

  return {
    used: monthlyUsage,
    limit,
    remaining: Math.max(0, limit - monthlyUsage),
    percentage: limit > 0 ? Math.round((monthlyUsage / limit) * 100) : 0,
    isNearLimit: monthlyUsage >= (isPremium ? 4 : 1),
    isAtLimit: monthlyUsage >= limit,
    isPremium,
  };
}

async function handleGet(request) {
  const user = request.user;
  const usage = calculateUsage(user);

  return NextResponse.json({
    success: true,
    user: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name || `${user.firstName} ${user.lastName}`,
      avatar: user.avatar || null,
      location: user.location || null,
      bio: user.profile?.bio || "",
      role: user.role || "student",
      interests: user.interests || [],
      interestCategories: user.interestCategories || [],
      skillLevel: user.skillLevel || "beginner",
      goals: user.goals || [],
      timeCommitment: user.timeCommitment || 30,
      ageGroup: user.ageGroup,
      educationLevel: user.educationLevel,
      learningStyle: user.learningStyle,
      emailVerified: user.emailVerified || false,
      status: user.status,
      onboardingCompleted: !!user.onboardingCompleted,
      isPremium: usage.isPremium,
      createdAt: user.createdAt,
      usage,
    },
  });
}

async function handlePut(request) {
  const user = request.user;
  const updates = await request.json();

  const { firstName, lastName, bio, location, avatar } = updates;

  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json(
      { error: "First name and last name are required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const updateFields = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    name: `${firstName.trim()} ${lastName.trim()}`,
    updatedAt: new Date(),
  };

  if (bio !== undefined) updateFields["profile.bio"] = bio?.trim() || "";
  if (location !== undefined)
    updateFields.location = location?.trim() || null;
  if (avatar !== undefined) updateFields.avatar = avatar || null;

  const { db } = await connectToDatabase();

  const result = await db
    .collection("users")
    .updateOne({ _id: user._id }, { $set: updateFields });

  const updatedUser = await db
    .collection("users")
    .findOne(
      { _id: user._id },
      { projection: { password: 0, refreshTokens: 0 } }
    );

  return NextResponse.json({
    success: true,
    message: "Profile updated successfully",
    user: {
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      firstName: updatedUser.name ? updatedUser.name.split(" ")[0] : "",
      lastName: updatedUser.name
        ? updatedUser.name.split(" ").slice(1).join(" ")
        : "",
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      location: updatedUser.location,
      bio: updatedUser.profile?.bio || "",
      usage: calculateUsage(updatedUser),
    },
  });
}

async function handlePost(request) {
  const user = request.user;
  const updates = await request.json();

  const {
    interests,
    interestCategories,
    skillLevel,
    goals,
    timeCommitment,
    onboardingCompleted,
    generatedPremiumCourse,
    ageGroup,
    educationLevel,
    learningStyle,
  } = updates;

  const updateFields = {};
  const addToSet = {};

  if (interests !== undefined)
    updateFields.interests = Array.isArray(interests) ? interests : [];
  if (interestCategories !== undefined)
    updateFields.interestCategories = Array.isArray(interestCategories)
      ? interestCategories
      : [];
  if (skillLevel !== undefined) updateFields.skillLevel = skillLevel;
  if (goals !== undefined)
    updateFields.goals = Array.isArray(goals) ? goals : [];
  if (timeCommitment !== undefined)
    updateFields.timeCommitment = timeCommitment;
  if (onboardingCompleted !== undefined)
    updateFields.onboardingCompleted = !!onboardingCompleted;
  if (ageGroup !== undefined) updateFields.ageGroup = ageGroup;
  if (educationLevel !== undefined)
    updateFields.educationLevel = educationLevel;
  if (learningStyle !== undefined) updateFields.learningStyle = learningStyle;

  if (generatedPremiumCourse) {
    addToSet["generatedPremiumCourses"] = {
      courseId: generatedPremiumCourse.courseId,
      courseTitle: generatedPremiumCourse.courseTitle,
      generatedAt: generatedPremiumCourse.generatedAt
        ? new Date(generatedPremiumCourse.generatedAt)
        : new Date(),
    };
  }

  const operations = {};
  if (Object.keys(updateFields).length > 0) operations.$set = updateFields;
  if (Object.keys(addToSet).length > 0) operations.$addToSet = addToSet;

  if (Object.keys(operations).length === 0) {
    return NextResponse.json(
      { error: "No valid updates provided", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const { db } = await connectToDatabase();
  await db.collection("users").updateOne({ _id: user._id }, operations);

  const updatedUser = await db
    .collection("users")
    .findOne(
      { _id: user._id },
      { projection: { password: 0, refreshTokens: 0 } }
    );

  // If onboardingCompleted changed, update a readable cookie for middleware
  if (onboardingCompleted !== undefined) {
    try {
      const cookieStore = await cookies();
      const isProd = process.env.NODE_ENV === "production";
      const cookieConfig = {
        httpOnly: false,
        secure: isProd,
        sameSite: isProd ? "strict" : "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      };
      cookieStore.set(
        "onboardingCompleted",
        updatedUser.onboardingCompleted ? "true" : "false",
        cookieConfig
      );
    } catch (cookieErr) {
      console.warn("Failed to set onboarding cookie:", cookieErr);
    }
  }

  return NextResponse.json({
    success: true,
    message: "Profile updated successfully",
    user: {
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      name: updatedUser.name,
      interests: updatedUser.interests || [],
      interestCategories: updatedUser.interestCategories || [],
      skillLevel: updatedUser.skillLevel,
      goals: updatedUser.goals || [],
      timeCommitment: updatedUser.timeCommitment,
      ageGroup: updatedUser.ageGroup,
      educationLevel: updatedUser.educationLevel,
      learningStyle: updatedUser.learningStyle,
      onboardingCompleted: !!updatedUser.onboardingCompleted,
      emailVerified: !!updatedUser.emailVerified,
      status: updatedUser.status,
      usage: calculateUsage(updatedUser),
    },
  });
}

export const GET = combineMiddleware(withErrorHandling, withAuth)(handleGet);
export const PUT = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePut);
export const POST = combineMiddleware(withErrorHandling, withCsrf, withAuth)(handlePost);
