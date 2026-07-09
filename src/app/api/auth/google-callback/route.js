import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OAuth2Client } from "google-auth-library";
import { connectToDatabase } from "@/lib/mongodb";
import { generateTokenPair, sanitizeUser } from "@/lib/auth";
import { generateCsrfToken, setCsrfCookie } from "@/lib/csrf";
import { ObjectId } from "mongodb";
import { SIGNUP_CREDITS } from "@/lib/planLimits";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(new URL("/auth/login?error=no_code", request.url));
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL || "https://actirova.com"}/api/auth/google-callback`;

    const client = new OAuth2Client(clientId, clientSecret, redirectUri);

    // Exchange authorization code for tokens
    const { tokens } = await client.getToken(code);
    const idToken = tokens.id_token;
    const accessToken = tokens.access_token;

    let payload;
    let googleId;
    let email;
    let name;
    let picture;

    if (idToken) {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      googleId = payload.sub;
    } else if (accessToken) {
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      email = data.email;
      name = data.name;
      picture = data.picture;
      googleId = data.sub;
    } else {
      return NextResponse.redirect(new URL("/auth/login?error=auth_failed", request.url));
    }

    const { db } = await connectToDatabase();
    const usersCol = db.collection("users");

    let user = await usersCol.findOne({ email: email.toLowerCase() });

    if (!user) {
      const newUser = {
        email: email.toLowerCase(),
        name: name || email.split("@")[0],
        avatar: picture,
        googleId,
        emailVerified: true,
        status: "active",
        role: "student",
        onboardingCompleted: false,
        streak: 0,
        totalLearningTime: 0,
        credits: SIGNUP_CREDITS,
        purchasedItems: [],
        achievements: [],
        createdAt: new Date(),
        lastLogin: new Date(),
        loginCount: 1,
      };

      const result = await usersCol.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    } else {
      const updateData = { lastLogin: new Date(), lastActive: new Date() };
      if (!user.googleId) updateData.googleId = googleId;
      if (!user.avatar && picture) updateData.avatar = picture;

      await usersCol.updateOne(
        { _id: user._id },
        { $set: updateData, $inc: { loginCount: 1 } }
      );
      user = { ...user, ...updateData };
    }

    // Generate tokens
    const { accessToken: jwtAccessToken, refreshToken, jti } = generateTokenPair(
      { id: user._id.toString(), email: user.email },
      { expiresIn: "7d" }
    );

    const refreshTokensCol = db.collection("refreshTokens");
    await refreshTokensCol.insertOne({
      token: refreshToken,
      jti,
      userId: user._id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      revoked: false,
    });

    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === "production";

    const cookieConfig = { httpOnly: true, secure: isProd, sameSite: isProd ? "strict" : "lax", path: "/" };

    cookieStore.set("token", jwtAccessToken, { ...cookieConfig, maxAge: 7 * 24 * 60 * 60 });
    cookieStore.set("refreshToken", refreshToken, { ...cookieConfig, maxAge: 30 * 24 * 60 * 60 });

    const csrfToken = generateCsrfToken();
    setCsrfCookie(cookieStore, csrfToken, isProd);

    cookieStore.set("emailVerified", "true", { httpOnly: false, secure: isProd, sameSite: isProd ? "strict" : "lax", path: "/", maxAge: 30 * 24 * 60 * 60 });
    cookieStore.set("onboardingCompleted", user.onboardingCompleted ? "true" : "false", { httpOnly: false, secure: isProd, sameSite: isProd ? "strict" : "lax", path: "/", maxAge: 30 * 24 * 60 * 60 });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Google Callback Error:", error);
    return NextResponse.redirect(new URL("/auth/login?error=callback_error", request.url));
  }
}
