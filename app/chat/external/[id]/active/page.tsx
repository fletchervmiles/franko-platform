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
    console.log("Welcome Description Status:", {
      fromUrl: welcomeDesc ? true : false,
      fromStorage: !welcomeDesc && storedWelcomeDesc ? true : false,
      finalValue: welcomeDescription,
      userAgent: navigator.userAgent
    });
    
    // If we have a welcome description from URL, store it for future fallback
    if (welcomeDesc && typeof window !== 'undefined') {
      localStorage.setItem(`chat_${id}_welcome`, decodeURIComponent(welcomeDesc));
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