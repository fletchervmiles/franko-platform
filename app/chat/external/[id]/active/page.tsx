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

  // Prefetch user data as soon as the page loads
  // This speeds up the auto-greeting by having data ready before the chat component needs it
  useEffect(() => {
    if (chatResponseId) {
      // Prefetch the user data for the chat response
      queryClient.prefetchQuery({
        queryKey: ['chatResponse', chatResponseId, 'user'],
        queryFn: async () => {
          const res = await fetch(`/api/chat-responses/${chatResponseId}`);
          if (!res.ok) {
            throw new Error("Failed to fetch chat response user data");
          }
          return res.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    }
  }, [chatResponseId]);

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