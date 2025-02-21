"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export default function LoginPage() {
  const { theme } = useTheme();

  return (
    <SignIn
      appearance={{
        elements: {
          formButtonPrimary: 'bg-black hover:bg-gray-800',
        },
      }}
      forceRedirectUrl="/workspace"
    />
  );
}