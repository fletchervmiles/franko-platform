"use client";

import React from "react";
import Script from "next/script";
import { useAuth, useUser } from "@clerk/nextjs";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  const name = user?.fullName ?? "";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  return (
    <>
      {/*
        On mobile, full viewport centering prevents scrolling when the content is taller than the screen.
        We switch to min-h-screen for mobile and only enforce full height centering on large screens.
      */}
      {/* Flex centering only on large screens; mobile behaves like a normal block container for natural scrolling */}
      <div className="min-h-screen flex justify-center items-start lg:items-center lg:h-screen">{children}</div>

      {isSignedIn && (
        <>
          {/* Identity snippet for Franko */}
          <Script
            id="franko-user"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.FrankoUser = { user_id: ${JSON.stringify(
                userId
              )}, user_metadata: { name: ${JSON.stringify(name)}, email: ${JSON.stringify(
                email
              )} } };`,
            }}
          />

          {/* Bubble script now injected globally in FrankoBubble component */}
        </>
      )}
    </>
  );
}


  