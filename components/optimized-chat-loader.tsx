/**
 * Optimized Chat Loader Component
 * 
 * This component implements a cascading loading strategy to prioritize
 * critical UI components while deferring non-essential elements.
 */

"use client";

import React, { Suspense, useState } from "react";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Initial loading placeholder with minimal footprint
const InitialLoadingState = () => (
  <div className="h-full flex items-center justify-center">
    <div className="flex flex-col items-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-2 text-sm text-muted-foreground">
        Loading conversation...
      </p>
    </div>
  </div>
);

// Dynamically import the ExternalChatWrapper with custom loading strategy
const DynamicExternalChatWrapper = dynamic(
  () => import("./external-chat-wrapper").then(mod => ({ default: mod.ExternalChatWrapper })),
  {
    loading: () => <InitialLoadingState />,
    ssr: false,
  }
);

interface OptimizedChatLoaderProps {
  chatInstanceId: string;
  chatResponseId: string;
  welcomeDescription?: string;
}

export function OptimizedChatLoader({
  chatInstanceId,
  chatResponseId,
  welcomeDescription,
}: OptimizedChatLoaderProps) {
  return (
    <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-[#F9F8F6] touch-none">
      <Suspense fallback={<InitialLoadingState />}>
        <DynamicExternalChatWrapper
          chatInstanceId={chatInstanceId}
          chatResponseId={chatResponseId}
          initialMessages={[]}
          welcomeDescription={welcomeDescription}
        />
      </Suspense>
    </div>
  );
}