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
  const localToken = request.cookies.get("token")?.value;

  // Check if accessing admin subdomain
  if (hostname.startsWith("admin.") || hostname === "admin.localhost:3000") {
    url.pathname = `/admin${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // If user has a local token, we consider them authenticated for the purpose of middleware routing
  if (!isPublicRoute(request) && !localToken) {
    await auth.protect();
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
