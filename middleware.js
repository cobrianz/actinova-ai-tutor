import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Get token from cookies or Authorization header
  let token = request.cookies.get("token")?.value;
  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/signup",
    "/auth/verify-email",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/about",
    "/contact",
    "/pricing",
    "/privacy",
    "/terms",
    "/blog",
  ];

  // Specific check for public API routes or webhooks if any
  if (pathname.startsWith("/api/webhook") || pathname.startsWith("/api/public") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check if the current path is a public route
  const isPublic = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + "/")
  );

  // Allow access to public routes
  if (isPublic) {
    // If user is logged in and trying to access auth pages, redirect to dashboard
    if (token && pathname.startsWith("/auth") && pathname !== "/auth/verify-email") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // If not public and no token, redirect to login
  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
