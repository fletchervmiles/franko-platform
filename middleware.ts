// middleware sits between the request and the response, i.e. the frontend and the backend

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/account",
  "/account/:path*",
  "/workspace",
  "/workspace/:path*",
  "/interview",
  "/interview/:path*",
  "/payment",
  "/payment/:path*",
  "/settings",
  "/settings/:path*",
  "/dashboard",
  "/dashboard/:path*",
  "/conversations",
  "/conversations/:path*" 
]);

// Protected API routes return 401 when not authenticated
const isProtectedApiRoute = createRouteMatcher([
  "/api/chat",
  "/api/chat/:path*",
  "/api/history",
  "/api/history/:path*",
  "/api/chat-instances",
  "/api/chat-instances/details",
  "/api/chat-instances/update"
]);

// Public API routes that don't require authentication
const isPublicApiRoute = createRouteMatcher([
  "/api/internal-chat/:path*",
  "/api/external-chat",
  "/api/external-chat/:path*",
  "/api/prompt-cache-warmup",
  "/api/chat-responses/:id",
  "/api/chat-instances/with-responses",
  "/api/chat-instances/:id",
  "/api/chat/initialize",
  "/api/internal-chat",
  "/api/webhooks/stripe/webhook"
]);

// Public routes don't require authentication
const isPublicRoute = createRouteMatcher([
  "/external-chat/:path*",
  "/interview-complete/:path*"
]);

export default clerkMiddleware(async (auth, req) => {
  // Check if the request is for external chat resources (both page and API)
  const isExternalChatPage = req.nextUrl.pathname.includes('/chat/external/');
  const isExternalChatApi = req.nextUrl.pathname.startsWith('/api/chat-instances/') && 
                            req.nextUrl.pathname.length > '/api/chat-instances/'.length;
  const isUsageApi = req.nextUrl.pathname === '/api/usage';
  
  // Allow external chat resources to pass through without authentication
  if (isExternalChatPage || isExternalChatApi || isUsageApi) {
    return NextResponse.next();
  }

  // Get authentication info (may be null for public routes)
  const { userId, redirectToSignIn } = await auth();
  
  // Check if the route matches our matchers
  const isProtected = isProtectedRoute(req);
  const isApiRoute = isProtectedApiRoute(req);
  const isPublicApi = isPublicApiRoute(req);
  const isPublic = isPublicRoute(req);

  // Check if the route is a public API
  if (isPublicApi) {
    return NextResponse.next();
  }

  // Check if the route is a public UI route
  if (isPublic) {
    return NextResponse.next();
  }

  // For API routes, return 401 if not authenticated
  if (!userId && isApiRoute) {
    return new Response("Unauthorized", { status: 401 });
  }

  // For protected UI routes, redirect to sign-in
  if (!userId && isProtected) {
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