// src/app/api/auth/logout/route.js

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  // await the cookie store
  const cookieStore = await cookies();

  // expire the token on the same path it was set
  cookieStore.delete("token", { path: "/" });

  return NextResponse.json({ message: "Logged out" });
}
