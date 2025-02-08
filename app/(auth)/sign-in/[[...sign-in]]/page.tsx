"use client";

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignIn
      signUpUrl="/sign-up"
      redirectUrl="/chat"
      path="/sign-in"
      routing="path"
    />
  );
} 