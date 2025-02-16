"use client";

import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignUp
      signInUrl="/sign-in"
      redirectUrl="/context-setup"
      path="/sign-up"
      routing="path"
    />
  );
}