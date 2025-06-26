// src/app/api/login/route.js

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req) {
  const { email, password, rememberMe } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return NextResponse.json(
      { error: "No account found for that email" },
      { status: 404 }
    );
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // issue a token (longer if “remember me”)
  const token = signToken(
    user,
    rememberMe ? { expiresIn: "30d" } : { expiresIn: "1h" }
  );

  // properly await the cookie store, then set it
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60,
  });

  return NextResponse.json({
    user: { name: user.name, email: user.email },
  });
}
