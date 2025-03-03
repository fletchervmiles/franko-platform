"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { WelcomeForm } from "@/components/welcome-form";
import { getChatInstanceById } from "@/db/queries/chat-instances-queries";
import { Loader2 } from "lucide-react";

export default function StartChatPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatInstance, setChatInstance] = useState<any>(null);

  useEffect(() => {
    const fetchChatInstance = async () => {
      try {
        const instance = await getChatInstanceById(id);
        setChatInstance(instance);
      } catch (err) {
        console.error('Failed to fetch chat instance:', err);
        setError('Failed to load chat session');
      }
    };

    fetchChatInstance();
  }, [id]);

  const handleStartChat = async (formData?: {
    firstName: string;
    email: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Initialize chat response
      const response = await fetch('/api/chat-responses/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatInstanceId: id,
          ...(formData && {
            intervieweeFirstName: formData.firstName,
            intervieweeEmail: formData.email,
          }),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to initialize chat');
      }

      const data = await response.json();
      
      // Set navigating state before redirect
      setIsNavigating(true);
      
      // Redirect to the active chat page with both IDs
      router.push(`/chat/external/${id}/active?responseId=${data.chatResponseId}`);
    } catch (err) {
      console.error('Failed to start chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to start chat');
    } finally {
      setIsLoading(false);
    }
  };

  if (!chatInstance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 bg-white shadow-lg">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">
              Welcome! Ready to Chat?
            </h1>
            <p className="text-gray-600">
              {chatInstance.welcomeDescription || 
                "This will be a brief 3-4 minute chat to share your thoughts on Clerk.com's onboarding and documentation. Your feedback will help make the experience even better for developers like you!"}
            </p>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {chatInstance.respondentContacts ? (
            <WelcomeForm 
              onSubmit={handleStartChat}
              isLoading={isLoading}
            />
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => handleStartChat()}
                disabled={isLoading}
                className={`
                  w-full max-w-sm bg-gradient-to-r from-blue-500 to-indigo-600 
                  hover:from-blue-600 hover:to-indigo-700 text-white
                  py-2 px-4 rounded-lg transition-all duration-200 shadow-sm
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isLoading ? "Preparing Your Session..." : "Get Started"}
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 