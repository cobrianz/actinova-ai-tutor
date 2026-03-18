
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OAuth2Client } from "google-auth-library";
import { connectToDatabase } from "@/lib/mongodb";
import { generateTokenPair, sanitizeUser } from "@/lib/auth";
import { generateCsrfToken, setCsrfCookie } from "@/lib/csrf";
import { ObjectId } from "mongodb";

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(request) {
  try {
    const { credential, accessToken: googleAccessToken } = await request.json();

    if (!credential && !googleAccessToken) {
      return NextResponse.json({ error: "Google credential or access token is required" }, { status: 400 });
    }

    let payload;
    let googleId;

    if (credential) {
      // Verify Google ID Token
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return NextResponse.json({ error: "Invalid Google token" }, { status: 400 });
      }
      googleId = payload.sub;
    } else {
      // Use Access Token to fetch User Info
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
        },
      });
      if (!response.ok) {
        return NextResponse.json({ error: "Failed to fetch user info from Google" }, { status: 400 });
      }
      payload = await response.json();
      googleId = payload.sub;
    }

    const { email, name, picture } = payload;

    const { db } = await connectToDatabase();
    const usersCol = db.collection("users");

    // Find or create user
    let user = await usersCol.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user (Sign-up flow)
      const newUser = {
        email: email.toLowerCase(),
        name: name || email.split("@")[0],
        avatar: picture,
        googleId,
        emailVerified: true, // Google emails are already verified
        status: "active",
        role: "student",
        onboardingCompleted: false,
        isPremium: false,
        streak: 0,
        totalLearningTime: 0,
        achievements: [],
        createdAt: new Date(),
        lastLogin: new Date(),
        loginCount: 1,
        monthlyUsage: 0,
        usageResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        subscription: {
           tier: "free",
           status: "none"
        }
      };

      const result = await usersCol.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    } else {
      // Update existing user (Sign-in flow)
      const updateData = {
        lastLogin: new Date(),
        lastActive: new Date(),
      };

      // Link googleId if not already present
      if (!user.googleId) {
        updateData.googleId = googleId;
      }
      
      // Update avatar if missing
      if (!user.avatar && picture) {
        updateData.avatar = picture;
      }

      await usersCol.updateOne(
        { _id: user._id },
        { 
          $set: updateData,
          $inc: { loginCount: 1 }
        }
      );
      
      // Refresh user object from DB for next steps
      user = { ...user, ...updateData };
    }

    // --- SESSION GENERATION (Mirrored from /api/login/route.js) ---

    // Generate tokens
    const { accessToken, refreshToken, jti } = generateTokenPair(
      { id: user._id.toString(), email: user.email },
      { expiresIn: "7d" } // Default to 7d for Google login (or 30d if preferred)
    );

    // Store refresh token in database
    const refreshTokensCol = db.collection("refreshTokens");
    await refreshTokensCol.insertOne({
      token: refreshToken,
      jti: jti,
      userId: user._id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      revoked: false,
    });

    // Set secure cookies
    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === "production";

    const cookieConfig = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
      path: "/",
    };

    cookieStore.set("token", accessToken, {
      ...cookieConfig,
      maxAge: 7 * 24 * 60 * 60,
    });

    cookieStore.set("refreshToken", refreshToken, {
      ...cookieConfig,
      maxAge: 30 * 24 * 60 * 60,
    });

    // Generate and set CSRF token
    const csrfToken = generateCsrfToken();
    setCsrfCookie(cookieStore, csrfToken, isProd);

    // Convenience flags
    cookieStore.set("emailVerified", "true", {
      httpOnly: false,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    
    cookieStore.set("onboardingCompleted", user.onboardingCompleted ? "true" : "false", {
      httpOnly: false,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    // Calculate usage for UI
    const isPremium = user.isPremium || (user.subscription?.plan === "pro" && user.subscription?.status === "active");
    const usageData = {
      used: user.monthlyUsage || 0,
      limit: isPremium ? 15 : 2,
      isPremium,
    };

    const safeUser = sanitizeUser({
      ...user,
      id: user._id.toString(),
      isPremium,
    });

    return NextResponse.json({
      success: true,
      message: "Successfully authenticated with Google",
      user: {
        ...safeUser,
        usage: usageData,
      },
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    return NextResponse.json(
      { error: "Authentication failed. Please try again or use email login." },
      { status: 500 }
    );
  }
}
