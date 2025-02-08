import Image from "next/image";
import Link from "next/link";

import { auth } from "@clerk/nextjs/server";
import { SignOutButton, UserButton } from "@clerk/nextjs";

import { History } from "./history";
import { SlashIcon } from "./icons";
import { Button } from "../ui/button";

// Navbar component - handles the top navigation bar of the application
// This is an async component because it needs to fetch the authentication session
export const Navbar = async () => {
  // Get the current authentication session
  const { userId } = await auth();

  return (
    <>
      {/* Main navbar container - fixed at top of viewport */}
      <div className="bg-background absolute top-0 left-0 w-dvw py-2 px-3 justify-between flex flex-row items-center z-30">
        {/* Left side of navbar containing logo and history */}
        <div className="flex flex-row gap-3 items-center">
          {/* History component - likely handles chat/navigation history */}
          <History userId={userId} />
          
          {/* Logo and application title section */}
          <div className="flex flex-row gap-2 items-center">
            {/* Application logo */}
            <Image
              src="/images/gemini-logo.png"
              height={20}
              width={20}
              alt="gemini logo"
            />
            {/* Decorative slash icon */}
            <div className="text-zinc-500">
              <SlashIcon size={16} />
            </div>
            {/* Application title - responsive width for different screen sizes */}
            <div className="text-sm dark:text-zinc-300 truncate w-28 md:w-fit">
              Next.js Gemini Chatbot
            </div>
          </div>
        </div>

        {/* Right side of navbar - Conditional rendering based on authentication state */}
        {userId ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <Button className="py-1.5 px-2 h-fit font-normal text-white" asChild>
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </>
  );
};
