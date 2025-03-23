/**
 * Optimized Chat Loader Component
 * 
 * This component implements a cascading loading strategy to prioritize
 * critical UI components while deferring non-essential elements.
 */

"use client";

import React, { Suspense, useState, useEffect } from "react";
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
  // State to hold potentially recovered welcome description
  const [recoveredDescription, setRecoveredDescription] = useState<string | undefined>(welcomeDescription);
  
  // Try to recover the welcome description if it wasn't passed down
  useEffect(() => {
    if (!welcomeDescription && typeof window !== 'undefined') {
      console.log("OptimizedChatLoader: Attempting to recover missing welcome description");
      
      // Try different storage locations
      const fromStandardStorage = localStorage.getItem(`chat_${chatInstanceId}_welcome`);
      const fromSessionStorage = sessionStorage.getItem(`chat_${chatInstanceId}_welcome`);
      const fromGenericStorage = localStorage.getItem('latest_welcome_desc');
      
      // Log what we found
      console.log("Recovery attempts:", {
        fromStandardStorage,
        fromSessionStorage,
        fromGenericStorage
      });
      
      // Use the first available description
      const recoveredValue = fromStandardStorage || fromSessionStorage || fromGenericStorage;
      
      if (recoveredValue) {
        console.log("Successfully recovered welcome description:", recoveredValue);
        setRecoveredDescription(recoveredValue);
      } else {
        console.log("Failed to recover welcome description");
      }
    }
  }, [welcomeDescription, chatInstanceId]);
  
  return (
    <div className="h-screen bg-[#F9F8F6]">
      <Suspense fallback={<InitialLoadingState />}>
        <DynamicExternalChatWrapper
          chatInstanceId={chatInstanceId}
          chatResponseId={chatResponseId}
          initialMessages={[]}
          welcomeDescription={recoveredDescription}
        />
      </Suspense>
    </div>
  );
}