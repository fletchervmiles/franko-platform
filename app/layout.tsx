import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/utilities/providers";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";
import { ClerkProfileSync } from "@/components/utilities/clerk-profile-sync";
import { geist, geistMono } from './fonts'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  title: {
    template: '%s | Customer Research',
    default: 'Franko'
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
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined
      }}
    >
      <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
        <body 
          className="bg-background text-foreground"
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
            <Analytics />
            <SpeedInsights />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}