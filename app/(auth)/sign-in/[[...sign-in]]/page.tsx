"use client";

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignIn
      signUpUrl="/sign-up"
      redirectUrl="/create"
      path="/sign-in"
      routing="path"
    />
  );
} 