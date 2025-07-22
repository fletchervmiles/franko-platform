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
      <div className="flex h-screen items-center justify-center">{children}</div>

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


  