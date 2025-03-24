// middleware sits between the request and the response, i.e. the frontend and the backend

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Simple rate limit tracking with a basic counter
const ratelimitCache = new Map();

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
  // Explicit bypasses for specific routes
  const url = req.nextUrl.pathname;
  
  // Bypass auth for external chat pages and their API endpoints
  if (url.includes('/chat/external/') || 
      url === '/api/usage' || 
      url.startsWith('/api/external-chat/history') ||
      url.startsWith('/api/chat-responses/') ||
      (url.startsWith('/api/chat-instances/') && url.split('/').length === 4)) {
    
    // Apply rate limiting to public endpoints
    // Skip rate limiting for webhook route which might have high traffic from Stripe
    if (!url.includes('/api/webhooks/')) {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      const now = Date.now();
      
      // Get or initialize tracking for this IP
      const ipData = ratelimitCache.get(ip) || { count: 0, resetTime: now + 10000 };
      
      // Reset counter if window expired
      if (now > ipData.resetTime) {
        ipData.count = 0;
        ipData.resetTime = now + 10000;
      }
      
      // Increment count
      ipData.count++;
      ratelimitCache.set(ip, ipData);
      
      // Apply rate limit (15 requests per 10 seconds)
      if (ipData.count > 15) {
        return new Response(JSON.stringify({ error: 'Too many requests' }), { 
          status: 429,
          headers: {
            'Retry-After': '10',
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
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
    // Apply rate limiting to public API routes
    // Skip rate limiting for webhook route which might have high traffic from Stripe
    if (!url.includes('/api/webhooks/')) {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      const now = Date.now();
      
      // Get or initialize tracking for this IP
      const ipData = ratelimitCache.get(ip) || { count: 0, resetTime: now + 10000 };
      
      // Reset counter if window expired
      if (now > ipData.resetTime) {
        ipData.count = 0;
        ipData.resetTime = now + 10000;
      }
      
      // Increment count
      ipData.count++;
      ratelimitCache.set(ip, ipData);
      
      // Apply rate limit (15 requests per 10 seconds)
      if (ipData.count > 15) {
        return new Response(JSON.stringify({ error: 'Too many requests' }), { 
          status: 429,
          headers: {
            'Retry-After': '10',
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
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
    '/((?!.+\\.[\\w]+$|_next|chat/external|api/chat-instances/[^/]+$|api/usage).*)',
    '/',
    '/(api|trpc)(.*)'
  ]
};