import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/utilities/providers";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import Script from 'next/script';
import "./globals.css";
import { ClerkProfileSync } from "@/components/utilities/clerk-profile-sync";
import { geist, geistMono } from './fonts'
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ProfileProvider } from "@/components/contexts/profile-context";
import { QueryProvider } from "@/components/utilities/query-provider";

export const metadata: Metadata = {
  title: {
    template: '%s | Customer Research',
    default: 'Franko'
  },
  description: 'Ready for a quick chat?!',
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
          <QueryProvider>
            <ProfileProvider>
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
                
                {/* Franko Feedback Modal Script */}
                <Script
                  id="franko-modal"
                  strategy="lazyOnload"
                  dangerouslySetInnerHTML={{
                    __html: `
                      (function(){if(!window.FrankoModal){window.FrankoModal=(...a)=>{window.FrankoModal.q=window.FrankoModal.q||[];window.FrankoModal.q.push(a)};window.FrankoModal=new Proxy(window.FrankoModal,{get:(t,p)=>p==="q"?t.q:(...a)=>t(p,...a)})}const l=()=>{const s=document.createElement("script");s.src="https://franko.ai/embed.js";s.setAttribute("data-modal-slug","franko-1753006030406");s.setAttribute("data-mode","manual");s.onload=()=>{if(window.FrankoModal.q){window.FrankoModal.q.forEach(([m,...a])=>window.FrankoModal[m]&&window.FrankoModal[m](...a));window.FrankoModal.q=[]}};document.head.appendChild(s)};document.readyState==="complete"?l():addEventListener("load",l)})();
                    `
                  }}
                />
              </Providers>
            </ProfileProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
