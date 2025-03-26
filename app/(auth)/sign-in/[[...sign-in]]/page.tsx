"use client";

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignIn
      signUpUrl="/sign-up"
      redirectUrl="/workspace"
      path="/sign-in"
      routing="path"
    />
  );
} 