import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/auth(.*)",
  "/api/webhook(.*)",
  "/api/billing/webhook(.*)",
  "/about(.*)",
  "/contact(.*)",
  "/pricing(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/blog(.*)",
  "/api/public(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";

  // Check if accessing admin subdomain
  if (hostname.startsWith("admin.") || hostname === "admin.localhost:3000") {
    url.pathname = `/admin${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Check for custom auth token
  const token = request.cookies.get("token")?.value;
  const isPublic = isPublicRoute(request);

  if (token) {
    // If user has a token and is on a login/signup page, redirect to dashboard
    if (url.pathname.startsWith("/auth/login") || url.pathname.startsWith("/auth/signup")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!isPublic) {
    // If not public and no custom token, let Clerk handle it or redirect
    try {
      await auth.protect();
    } catch (e) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
