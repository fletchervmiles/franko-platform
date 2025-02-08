// middleware sits between the request and the response, i.e. the frontend and the backend

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
    "/account(.*)",
    "/dashboard(.*)",
    "/interview(.*)",
    "/pricing(.*)",
    "/payment(.*)",
    "/chat",
    "/chat/(.*)"  // This will match all chat routes
]);

const isProtectedApiRoute = createRouteMatcher([
    "/api/chat(.*)",      // Protect chat API endpoints
    "/api/history(.*)",   // Protect history API endpoints
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();
  const isApiRoute = isProtectedApiRoute(req);

  // For API routes, return 401 if not authenticated
  if (!userId && isApiRoute) {
    return new Response("Unauthorized", { status: 401 });
  }

  // For protected UI routes, redirect to sign-in
  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // If the user is logged in and the route is protected, let them view
  if (userId && (isProtectedRoute(req) || isApiRoute)) {
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};