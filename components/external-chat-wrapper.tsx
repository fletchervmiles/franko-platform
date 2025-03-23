/**
 * External Chat Wrapper Component
 * 
 * This client component serves as a wrapper around the ExternalChat component:
 * 1. Provides Suspense boundary for loading states
 * 2. Shows a loading spinner while the chat is initializing
 * 3. Passes through all necessary props to the ExternalChat component
 * 
 * This wrapper improves user experience by showing a loading state
 * while the chat component is being loaded, and handles any potential
 * rendering errors or suspense states from the chat component.
 */

"use client"

import React, { Suspense, useState, useEffect } from "react"
import { Message } from "ai"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { ExternalChat } from '@/components/external-chat'
import { useChatHistory } from '@/lib/hooks/use-chat-history'
import { ErrorBoundary } from '@/components/error-boundary'

// Import types from ExternalChat
import { ExternalChat as ExternalChatType } from '@/components/external-chat'

// Dynamically import the ExternalChat component
const DynamicExternalChat = dynamic(
  () => import("@/components/external-chat").then((mod) => ({ default: mod.ExternalChat })),
  {
    loading: () => (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="text-sm text-gray-500 mt-2">Loading chat interface...</p>
      </div>
    ),
    ssr: false,
  }
)

interface ExternalChatWrapperProps {
  chatInstanceId: string       // ID of the chat instance
  chatResponseId: string       // ID of the chat response record
  initialMessages: any[]       // Initial messages to display
  welcomeDescription?: string  // Welcome description for the banner
}

/**
 * Wrapper component that fetches chat history and passes it to ExternalChat
 */
export function ExternalChatWrapper({
  chatInstanceId,
  chatResponseId,
  initialMessages,
  welcomeDescription,
}: ExternalChatWrapperProps) {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState<any>(null);
  
  // Track if we're loading for the first time
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Use our custom hook to fetch chat history
  const { 
    messages: historyMessages, 
    isLoading: isLoadingHistory,
    error: historyError
  } = useChatHistory({ 
    chatResponseId,
    enabled: true
  });
  
  // Once history is loaded, set initialLoad to false
  useEffect(() => {
    if (historyMessages.length > 0 || (!isLoadingHistory && initialLoad)) {
      setInitialLoad(false);
    }
  }, [historyMessages, isLoadingHistory, initialLoad]);
  
  // Error handler for the component
  const handleError = (error: Error) => {
    console.error("Error in ExternalChat:", error);
    setHasError(true);
    setErrorInfo(error);
  };
  
  // Show loading spinner during initial load
  if (isLoadingHistory && initialLoad) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            Loading conversation history...
          </p>
        </div>
      </div>
    );
  }
  
  // Show error message if loading fails
  if (historyError && initialLoad) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <p className="text-destructive font-medium">Error loading chat history</p>
          <p className="text-sm text-muted-foreground mt-1">{historyError.message}</p>
          <p className="text-sm mt-4">Starting new conversation...</p>
        </div>
      </div>
    );
  }
  
  // Show component error state if it fails to render
  if (hasError) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-red-500 font-semibold text-xl mb-4">
          Something went wrong
        </div>
        <div className="text-gray-600 text-sm mb-6 max-w-md text-center">
          We encountered an error while loading the chat. Please try refreshing the page or contact support if the problem persists.
        </div>
        <div className="text-xs text-gray-500 max-w-md overflow-auto bg-gray-100 p-2 rounded">
          {errorInfo?.toString()}
        </div>
      </div>
    );
  }
  
  // Pass the loaded messages to ExternalChat
  return (
    <ErrorBoundary onError={handleError}>
      <Suspense
        fallback={
          <div className="h-full flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="text-sm text-gray-500 mt-2">Loading interview...</p>
          </div>
        }
      >
        <DynamicExternalChat
          chatInstanceId={chatInstanceId}
          chatResponseId={chatResponseId}
          initialMessages={historyMessages.length > 0 ? historyMessages : initialMessages}
          welcomeDescription={welcomeDescription}
        />
      </Suspense>
    </ErrorBoundary>
  );
}