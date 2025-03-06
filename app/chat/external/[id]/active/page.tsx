"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalChatWrapper } from "@/components/external-chat-wrapper";
import { queryClient } from "@/components/utilities/query-provider";

export default function ActiveChatPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const searchParams = useSearchParams();
  const chatResponseId = searchParams.get("responseId");

  // Simplified prefetching strategy to ensure compatibility
  useEffect(() => {
    if (chatResponseId) {
      // Prefetch user data for greeting customization - using the standard API
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

  return (
    <div className="h-screen bg-[#F9F8F6]">
      <ExternalChatWrapper
        chatInstanceId={id}
        chatResponseId={chatResponseId}
        initialMessages={[]}
      />
    </div>
  );
} 