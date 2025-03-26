/**
 * Optimized Chat Loader Component
 * 
 * This component implements a cascading loading strategy to prioritize
 * critical UI components while deferring non-essential elements.
 */

"use client";

import React, { Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Initial loading placeholder with minimal footprint and consistent styling
const InitialLoadingState = () => {
  // Apply app-like styles to prevent zoom and pull-to-refresh
  useEffect(() => {
    // Apply fixed positioning to prevent pull-to-refresh
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.overscrollBehavior = 'none';
    
    return () => {
      // Clean up styles on unmount
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.overscrollBehavior = '';
    };
  }, []);
  
  return (
    <div className="h-[100dvh] flex items-center justify-center bg-[#F9F8F6]"
      style={{
        touchAction: "manipulation",
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        overscrollBehavior: 'none'
      }}
    >
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">
          Loading conversation...
        </p>
      </div>
    </div>
  );
};

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