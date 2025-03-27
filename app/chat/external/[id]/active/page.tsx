"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { OptimizedChatLoader } from "@/components/optimized-chat-loader";
import { queryClient } from "@/components/utilities/query-provider";
import { usePromptWarmup } from "@/lib/hooks/use-prompt-warmup";

// Custom hook to prevent zooming on mobile
const usePreventZoom = () => {
  useEffect(() => {
    // Create a meta tag to prevent zooming
    const metaTag = document.createElement('meta');
    metaTag.name = 'viewport';
    metaTag.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
    
    // Find any existing viewport meta tags
    const existingMetaTag = document.querySelector('meta[name="viewport"]');
    
    if (existingMetaTag) {
      // Update existing meta tag
      existingMetaTag.setAttribute('content', metaTag.content);
    } else {
      // Add new meta tag
      document.head.appendChild(metaTag);
    }
    
    // Cleanup - restore original meta tag on unmount
    return () => {
      if (existingMetaTag) {
        existingMetaTag.setAttribute('content', 'width=device-width, initial-scale=1');
      } else if (document.head.contains(metaTag)) {
        document.head.removeChild(metaTag);
      }
    };
  }, []);
};

export default function ActiveChatPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const searchParams = useSearchParams();
  const chatResponseId = searchParams?.get("responseId") || null;
  const welcomeDesc = searchParams?.get("welcomeDesc");
  const welcomeDescription = welcomeDesc ? decodeURIComponent(welcomeDesc) : undefined;
  
  // Start warming the prompt cache immediately when the page loads
  // This happens in parallel with other initialization
  const { isWarmed, promptLength } = usePromptWarmup(id);

  // Apply zoom prevention on this page too for consistency
  usePreventZoom();

  // Enhanced prefetching strategy including prompt warmup
  useEffect(() => {
    if (chatResponseId) {
      // Prefetch user data for greeting customization
      queryClient.prefetchQuery({
        queryKey: ['chatResponse', chatResponseId, 'user'],
        queryFn: async () => {
          try {
            const res = await fetch(`/api/chat-responses/${chatResponseId}`);
            if (!res.ok) {
              console.warn("Failed to prefetch chat response user data, will try again later");
              return { intervieweeFirstName: null };
            }
            return res.json();
          } catch (error) {
            console.warn("Error prefetching chat response data:", error);
            return { intervieweeFirstName: null };
          }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2
      });
    }
  }, [chatResponseId, queryClient]);

  if (!chatResponseId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Invalid chat session. Please start from the beginning.</div>
      </div>
    );
  }

  // Use the optimized loader component that implements lazy loading
  return <OptimizedChatLoader 
    chatInstanceId={id} 
    chatResponseId={chatResponseId}
    welcomeDescription={welcomeDescription} 
  />;
} 