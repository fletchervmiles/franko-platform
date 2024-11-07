import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/header";
import { Providers } from "@/components/utilities/providers";
import { createProfile, getProfileByUserId } from "@/db/queries/profiles-queries";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProfileSync } from "@/components/utilities/clerk-profile-sync";
import { geist, geistMono } from './fonts'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Franko - Platform",
  description: "Automated Customer Interviews & Insights."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (userId) {
    const profile = await getProfileByUserId(userId);
    if (!profile) {
      await createProfile({ userId });
    }
  }

  return (
    <ClerkProvider
      dynamic={true}
    >
      <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
        <body className={inter.className}>
          <Providers
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
          >
            {/* <Header /> */}
            <ClerkProfileSync />
            {children}
            <Toaster />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}