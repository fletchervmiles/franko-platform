"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { WelcomeForm } from "@/components/welcome-form";
import { Loader2 } from "lucide-react";
import { useConsolidatedChatInit } from "@/lib/hooks/use-consolidated-chat-init";

export default function StartChatPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [chatInstanceData, setChatInstanceData] = useState<{
    welcomeDescription?: string;
    respondentContacts?: boolean;
  } | null>(null);
  
  // Use consolidated initialization hook that handles both
  // chat instance retrieval and chat response creation in a single API call
  const { 
    mutate: initializeChat, 
    isPending: isInitializing, 
    error: initError,
    data: initData
  } = useConsolidatedChatInit();

  // Initial load - fetch instance data via the legacy API to ensure compatibility
  useEffect(() => {
    async function fetchInstanceData() {
      try {
        console.log(`Fetching chat instance data for ID: ${id}`);
        
        // Use the legacy API for the initial load to ensure compatibility
        // This loads just the chat instance details without creating a chat response yet
        const response = await fetch(`/api/chat-instances/${id}`);
        
        if (!response.ok) {
          console.warn(`Chat instance fetch failed with status ${response.status}`);
          
          // Provide fallback data instead of throwing an error
          // This ensures the UI can still render even if the API fails
          setChatInstanceData({
            welcomeDescription: "Welcome to this conversation. We appreciate your time and feedback!",
            respondentContacts: false
          });
        } else {
          const chatInstance = await response.json();
          console.log("Fetched chat instance data:", chatInstance);
          
          // Set the instance data from the response
          setChatInstanceData(chatInstance);
        }
      } catch (error) {
        console.error('Failed to fetch chat instance:', error);
        // Provide fallback data even when exceptions occur
        setChatInstanceData({
          welcomeDescription: "Welcome to this conversation. We appreciate your time and feedback!",
          respondentContacts: false
        });
      } finally {
        // Always stop the loading state, whether successful or not
        setIsLoading(false);
      }
    }
    
    // Only fetch if we don't have the data yet
    if (!chatInstanceData) {
      fetchInstanceData();
    }
  }, [chatInstanceData, id]);

  const handleStartChat = (formData?: {
    firstName: string;
    email: string;
  }) => {
    // Now we have user data, get a real chat response ID
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

  // Loading state
  if (isLoading) {
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

  // Error handling - don't show errors from the initial "ping" request
  // Only show errors from actual user-initiated submissions
  const errorMessage = isInitializing ? null : 
    (initError instanceof Error ? initError.message : null);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 bg-white shadow-lg">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">
              Welcome! Ready to Chat?
            </h1>
            <p className="text-gray-600">
              {chatInstanceData?.welcomeDescription || 
                "This will be a brief 3-4 minute chat to share your thoughts on Clerk.com's onboarding and documentation. Your feedback will help make the experience even better for developers like you!"}
            </p>
          </div>
          
          {errorMessage && (
            <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">
              {errorMessage}
            </div>
          )}
          
          {chatInstanceData?.respondentContacts ? (
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