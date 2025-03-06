"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { WelcomeForm } from "@/components/welcome-form";
import { Loader2 } from "lucide-react";
import { useChatInstance } from "@/lib/hooks/use-chat-instance";
import { useInitializeChatResponse } from "@/lib/hooks/use-initialize-chat-response";

export default function StartChatPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Use React Query hook for chat instance data
  const { 
    data: chatInstance, 
    isLoading: isLoadingInstance, 
    error: instanceError 
  } = useChatInstance(id);
  
  // Use React Query hook for chat response initialization
  const { 
    mutate: initializeChat, 
    isPending: isInitializing, 
    error: initError 
  } = useInitializeChatResponse();

  const handleStartChat = (formData?: {
    firstName: string;
    email: string;
  }) => {
    initializeChat(
      { 
        chatInstanceId: id, 
        userData: formData 
      },
      {
        onSuccess: (data) => {
          setIsNavigating(true);
          router.push(`/chat/external/${id}/active?responseId=${data.chatResponseId}`);
        },
      }
    );
  };

  // Loading state for chat instance
  if (isLoadingInstance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Navigating state
  if (isNavigating) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Error handling
  const errorMessage = instanceError instanceof Error 
    ? instanceError.message 
    : (initError instanceof Error ? initError.message : null);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 bg-white shadow-lg">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">
              Welcome! Ready to Chat?
            </h1>
            <p className="text-gray-600">
              {chatInstance?.welcomeDescription || 
                "This will be a brief 3-4 minute chat to share your thoughts on Clerk.com's onboarding and documentation. Your feedback will help make the experience even better for developers like you!"}
            </p>
          </div>
          
          {errorMessage && (
            <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">
              {errorMessage}
            </div>
          )}
          
          {chatInstance?.respondentContacts ? (
            <WelcomeForm 
              onSubmit={handleStartChat}
              isLoading={isInitializing}
            />
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => handleStartChat()}
                disabled={isInitializing}
                className={`
                  w-full max-w-sm bg-gradient-to-r from-blue-500 to-indigo-600 
                  hover:from-blue-600 hover:to-indigo-700 text-white
                  py-2 px-4 rounded-lg transition-all duration-200 shadow-sm
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isInitializing ? "Preparing Your Session..." : "Get Started"}
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 