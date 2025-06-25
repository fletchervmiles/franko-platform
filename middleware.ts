// middleware sits between the request and the response, i.e. the frontend and the backend

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Simple rate limit tracking with a basic counter
const ratelimitCache = new Map();

// Function to detect mobile devices from User-Agent
const isMobileDevice = (userAgent: string | null): boolean => {
  if (!userAgent) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

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
  "/api/webhooks/stripe/webhook",
  "/api/modal-chat/initialize",
  "/api/embed/:path*"
]);

// Public routes don't require authentication
const isPublicRoute = createRouteMatcher([
  "/external-chat/:path*",
  "/interview-complete/:path*",
  "/embed/:path*"  // Add embed routes as public
]);

export default clerkMiddleware(async (auth, req) => {
  // Explicit bypasses for specific routes
  const url = req.nextUrl.pathname;
  
  // Bypass auth for embed routes
  if (url.startsWith('/embed/') || url === '/embed.js') {
    // Apply CORS headers for embed routes
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
  }
  
  // Bypass auth for external chat pages and their API endpoints
  if (url === '/api/external-chat/finalize') {
    // Explicitly handle finalize route early to avoid potential body stream issues
    return NextResponse.next();
  } else if (url.includes('/chat/external/') || 
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

  // Check if user is on mobile and trying to access protected routes
  const userAgent = req.headers.get('user-agent');
  if (userId && isProtected && isMobileDevice(userAgent)) {
    // Redirect to a "desktop only" page
    return NextResponse.redirect(new URL('/desktop-only', req.url));
  }

  // If authenticated, add userId to headers and allow access
  if (userId) {
    // Clone the request headers and set a new header
    // This preserves the existing headers and adds the user ID
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('X-User-Id', userId);

    // Return NextResponse.next() with the new headers
    return NextResponse.next({
      request: {
        // New request headers
        headers: requestHeaders,
      },
    });
  }

  // Fallback for any other case (e.g., public route reached here without early return)
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match API/TRPC routes, BUT exclude /api/external-chat/finalize
    '/(api|trpc)((?!/external-chat/finalize).*)',
    // Match root
    '/',
    // Match other pages, excluding static files, _next, embed.js, and specific explicit bypasses already handled in code if needed
    // Note: The original complex regex might need adjustment based on what Clerk truly needs to see vs. what can be fully bypassed.
    // Keeping the original bypasses AND this matcher exclusion is safest.
     '/((?!.+\\.[\\w]+$|_next|embed\\.js|chat/external|api/chat-instances/[^/]+$|api/usage|api/external-chat/finalize).*)',
  ]
};

