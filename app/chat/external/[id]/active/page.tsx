"use client";

import { useSearchParams } from "next/navigation";
import { ExternalChatWrapper } from "@/components/external-chat-wrapper";

export default function ActiveChatPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const searchParams = useSearchParams();
  const chatResponseId = searchParams.get("responseId");

  if (!chatResponseId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Invalid chat session. Please start from the beginning.</div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <ExternalChatWrapper
        chatInstanceId={id}
        chatResponseId={chatResponseId}
        initialMessages={[]}
      />
    </div>
  );
} 