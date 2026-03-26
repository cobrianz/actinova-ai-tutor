// src/app/api/user/profile/route.js

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getTrackedUsageSummary } from "@/lib/usageSummary";
import { ObjectId } from "mongodb";

async function getUserIdFromToken(request) {
  const authHeader = request.headers.get("authorization");
  let token = authHeader?.startsWith("Bearer ")
    ? authHeader.split("Bearer ")[1].trim()
    : null;

  const { verifyToken } = await import("@/lib/auth");

  if (token) {
    try {
      const payload = verifyToken(token);
      if (payload?.id) {
        return new ObjectId(payload.id);
      }
    } catch (error) {
      // Header token invalid, try cookie
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const cookies = cookieHeader.split("; ").reduce((acc, cookie) => {
          const [key, value] = cookie.split("=");
          acc[key] = value;
          return acc;
        }, {});
        token = cookies.token;
        if (token) {
          try {
            const payload = verifyToken(token);
            if (payload?.id) {
              return new ObjectId(payload.id);
            }
          } catch (cookieError) {
            // Cookie token also invalid
          }
        }
      }
    }
  } else {
    // No header, check cookie
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const cookies = cookieHeader.split("; ").reduce((acc, cookie) => {
        const [key, value] = cookie.split("=");
        acc[key] = value;
        return acc;
      }, {});
      token = cookies.token;
      if (token) {
        try {
          const payload = verifyToken(token);
          if (payload?.id) {
            return new ObjectId(payload.id);
          }
        } catch (error) {
          // Cookie token invalid
        }
      }
    }
  }

  return null;
}

export async function GET(request) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne(
      { _id: userId, status: { $ne: "inactive" } },
      {
        projection: {
          password: 0,
          refreshTokens: 0,
          emailVerificationToken: 0,
          passwordResetCode: 0,
          "profile.bio": 0, // hide long fields if not needed
          courses: 0,
          timeCommitment: 0,
        },
      }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const usage = await getTrackedUsageSummary(db, user);

    return NextResponse.json({
      success: true,
      // Also expose usage at the top level for clients expecting data.usage
      usage,
      user: {
        id: user._id.toString(),
        email: user.email,
        // Prefer explicit fields if present; else derive from `name`
        firstName: user.firstName || (user.name ? user.name.split(" ")[0] : ""),
        lastName:
          user.lastName ||
          (user.name ? user.name.split(" ").slice(1).join(" ") : ""),
        name:
          user.name ||
          [user.firstName, user.lastName].filter(Boolean).join(" "),
        location: user.location,
        bio: user.profile?.bio || "",
        role: user.role || "student",
        isPremium: usage.isPremium,
        subscription: user.subscription,
        createdAt: user.createdAt,
        emailVerified: !!user.emailVerified,
        onboardingCompleted: !!user.onboardingCompleted,
        ageGroup: user.ageGroup,
        educationLevel: user.educationLevel,
        goals: user.goals || [],
        interestCategories: user.interestCategories || [],
        interests: user.interests || [],
        learningStyle: user.learningStyle,
        skillLevel: user.skillLevel,
        timeCommitment: user.timeCommitment,
        streak: user.streak || 0,
        totalLearningTime: user.totalLearningTime || 0,
        lastActive: user.lastActive,
        loginCount: user.loginCount || 0,
        settings: user.settings || {},
        billingHistory: user.billingHistory || [],
        avatar: user.avatar || null,
      },
    });
  } catch (error) {
    console.error("[GET /profile] Error:", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let updates;
    try {
      updates = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const {
      firstName,
      lastName,
      bio,
      location,
      avatar,
      interests,
      interestCategories,
      ageGroup,
      educationLevel,
      skillLevel,
      goals,
      learningStyle,
      timeCommitment,
      onboardingCompleted,
    } = updates;

    // For onboarding completion, we don't require firstName/lastName
    const isOnboardingUpdate = onboardingCompleted !== undefined;

    if (!isOnboardingUpdate && (!firstName?.trim() || !lastName?.trim())) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    const updateFields = {
      updatedAt: new Date(),
    };

    // Handle basic profile fields
    if (firstName !== undefined) {
      updateFields.firstName = firstName.trim();
      updateFields.name = `${firstName.trim()} ${lastName?.trim() || ""}`;
    }
    if (lastName !== undefined) {
      updateFields.lastName = lastName.trim();
      if (firstName !== undefined) {
        updateFields.name = `${firstName.trim()} ${lastName.trim()}`;
      }
    }
    if (bio !== undefined) updateFields["profile.bio"] = bio?.trim() || "";
    if (location !== undefined)
      updateFields.location = location?.trim() || null;
    if (avatar !== undefined) updateFields.avatar = avatar || null;

    // Handle onboarding fields
    if (interests !== undefined) updateFields.interests = interests;
    if (interestCategories !== undefined)
      updateFields.interestCategories = interestCategories;
    if (ageGroup !== undefined) updateFields.ageGroup = ageGroup;
    if (educationLevel !== undefined)
      updateFields.educationLevel = educationLevel;
    if (skillLevel !== undefined) updateFields.skillLevel = skillLevel;
    if (goals !== undefined) updateFields.goals = goals;
    if (learningStyle !== undefined) updateFields.learningStyle = learningStyle;
    if (timeCommitment !== undefined)
      updateFields.timeCommitment = timeCommitment;
    if (onboardingCompleted !== undefined)
      updateFields.onboardingCompleted = onboardingCompleted;

    const { db } = await connectToDatabase();

    const result = await db
      .collection("users")
      .updateOne({ _id: userId }, { $set: updateFields });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await db
      .collection("users")
      .findOne(
        { _id: userId },
        { projection: { password: 0, refreshTokens: 0 } }
      );

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        location: updatedUser.location,
        bio: updatedUser.profile?.bio || "",
        interests: updatedUser.interests,
        interestCategories: updatedUser.interestCategories,
        ageGroup: updatedUser.ageGroup,
        educationLevel: updatedUser.educationLevel,
        skillLevel: updatedUser.skillLevel,
        goals: updatedUser.goals,
        learningStyle: updatedUser.learningStyle,
        timeCommitment: updatedUser.timeCommitment,
        onboardingCompleted: updatedUser.onboardingCompleted || false,
        subscription: updatedUser.subscription,
        usage: await getTrackedUsageSummary(db, updatedUser),
      },
    });
  } catch (error) {
    console.error("[PUT /profile] Error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // Soft delete
    const result = await db.collection("users").updateOne(
      { _id: userId },
      {
        $set: {
          status: "inactive",
          email: `deleted_${userId}_${Date.now()}@deleted.local`,
          deletedAt: new Date(),
        },
        $unset: {
          avatar: "",
          refreshTokens: "",
          subscription: "",
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Account deactivated successfully. We're sad to see you go.",
    });
  } catch (error) {
    console.error("[DELETE /profile] Error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate account" },
      { status: 500 }
    );
  }
}
