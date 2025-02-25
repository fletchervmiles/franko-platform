// middleware sits between the request and the response, i.e. the frontend and the backend

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/account(.*)",
  "/workspace(.*)",
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

const isPublicRoute = createRouteMatcher([
  "/external-chat/(.*)",
  "/interview-complete/(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();
  const isApiRoute = isProtectedApiRoute(req);

  // Check if the route is public
  if (isPublicRoute(req)) {
    // Validate UUID format for public routes
    const pathParts = req.nextUrl.pathname.split('/');
    const uuid = pathParts[2];
    const isValidUUID = uuid && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
    
    if (!isValidUUID) {
      return NextResponse.redirect(new URL('/404', req.url));
    }
    return NextResponse.next();
  }

  // For API routes, return 401 if not authenticated
  if (!userId && isApiRoute) {
    return new Response("Unauthorized", { status: 401 });
  }

  // For protected UI routes, redirect to sign-in
  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // If authenticated, allow access to all routes
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)'
  ]
};