// src/app/api/me/route.js

import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { findUserByEmail } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return NextResponse.json({ user: null });
  }

  try {
    const decoded = verifyToken(token);
    const user = await findUserByEmail(decoded.email);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("/me error:", err);
    return NextResponse.json({ user: null });
  }
}
