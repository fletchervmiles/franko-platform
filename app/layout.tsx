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
  title: {
    template: '%s | Customer Research',
    default: 'Customer Research Platform'
  },
  description: 'Participate in our customer research interviews',
  manifest: '/favicon/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon/favicon.ico' },
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' }
    ],
    apple: {
      url: '/favicon/apple-touch-icon.png',
      type: 'image/png'
    },
    other: [
      {
        rel: 'mask-icon',
        url: '/favicon/favicon.svg',
        type: 'image/svg+xml'
      },
      {
        rel: 'manifest',
        url: '/favicon/site.webmanifest'
      }
    ]
  }
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
      appearance={{
        baseTheme: undefined
      }}
      dynamic={true}
    >
      <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
        <body 
          className={`${inter.className} bg-background text-foreground`}
          suppressHydrationWarning
        >
          <Providers
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
            forcedTheme="light"
          >
            <ClerkProfileSync />
            {children}
            <Toaster />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}