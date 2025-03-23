"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { OptimizedChatLoader } from "@/components/optimized-chat-loader";
import { queryClient } from "@/components/utilities/query-provider";
import { usePromptWarmup } from "@/lib/hooks/use-prompt-warmup";

export default function ActiveChatPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const searchParams = useSearchParams();
  const chatResponseId = searchParams.get("responseId");
  const welcomeDesc = searchParams.get("welcomeDesc");
  
  // Try to get welcome description from URL, then fallback to localStorage
  const storedWelcomeDesc = typeof window !== 'undefined' 
    ? localStorage.getItem(`chat_${id}_welcome`) 
    : null;
  
  // Prioritize URL param, then localStorage fallback
  const welcomeDescription = welcomeDesc 
    ? decodeURIComponent(welcomeDesc) 
    : storedWelcomeDesc || undefined;
  
  // Add debug logging to track welcome description status
  useEffect(() => {
    const isMobile = 
      typeof navigator !== 'undefined' ? 
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) : 
      false;
    
    console.log("Welcome Description Status (detailed):", {
      fromUrl: welcomeDesc ? true : false,
      fromStorage: !welcomeDesc && storedWelcomeDesc ? true : false,
      finalValue: welcomeDescription,
      valueLength: welcomeDescription?.length || 0,
      userAgent: navigator.userAgent,
      isMobile,
      urlParamLength: welcomeDesc?.length || 0,
      storageValue: storedWelcomeDesc
    });
    
    // Use more resilient storage method for mobile
    if (typeof window !== 'undefined') {
      try {
        // For debugging - always try to read from storage first
        const existingStorage = localStorage.getItem(`chat_${id}_welcome`);
        console.log("Current localStorage value:", existingStorage);
        
        // More aggressively store welcome description in multiple ways
        if (welcomeDescription) {
          // Try standard localStorage
          localStorage.setItem(`chat_${id}_welcome`, welcomeDescription);
          
          // Also store in sessionStorage as backup
          sessionStorage.setItem(`chat_${id}_welcome`, welcomeDescription);
          
          // Store without chat ID prefix as another fallback
          localStorage.setItem('latest_welcome_desc', welcomeDescription);
          
          console.log("Stored welcome description in multiple storage locations");
        }
      } catch (error) {
        console.error("Storage error:", error);
      }
    }
  }, [welcomeDesc, storedWelcomeDesc, welcomeDescription, id]);
  
  // Start warming the prompt cache immediately when the page loads
  // This happens in parallel with other initialization
  const { isWarmed, promptLength } = usePromptWarmup(id);

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