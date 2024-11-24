// middleware sits between the request and the response, i.e. the frontend and the backend

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([

    "/account(.*)",
    "/dashboard(.*)",
    "/interview(.*)",

]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();

  // If the user isn't signed in and the route is private, redirect to sign-in
  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn({ returnBackUrl: "/login" });
  }

  // If the user is logged in and the route is protected, let them view.
  if (userId && isProtectedRoute(req)) {
    return NextResponse.next();
  }
});

// export const config = {
//   matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"]
// };
// import { clerkMiddleware } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";

// export default clerkMiddleware(async (auth, req) => {
//   const { userId, redirectToSignIn } = await auth();
  
//   // If no user and not on home page, redirect to sign in
//   if (!userId) {
//     return redirectToSignIn();
//   }
  
//   return NextResponse.next();
// });

// export const config = {
//   matcher: [
//     // Skip home page and static files
//     "/((?!api|_next/static|_next/image|favicon.ico|$).*)",
//   ]
// };