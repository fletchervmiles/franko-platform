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

// Dynamically import the ExternalChat component for code splitting
const ExternalChat = dynamic(
  () => import("@/components/external-chat").then((mod) => ({ default: mod.ExternalChat })),
  {
    loading: () => (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="text-sm text-gray-500 mt-2">Preparing conversation interface...</p>
      </div>
    ),
    ssr: false,
  }
)

interface ExternalChatWrapperProps {
  chatInstanceId: string       // ID of the chat instance
  chatResponseId: string       // ID of the chat response record
  initialMessages: Message[]   // Initial messages to display
}

export function ExternalChatWrapper({
  chatInstanceId,
  chatResponseId,
  initialMessages,
}: ExternalChatWrapperProps) {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState<any>(null);

  const handleError = (error: Error) => {
    console.error("Error in ExternalChat:", error);
    setHasError(true);
    setErrorInfo(error);
  };

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
        <ExternalChat
          chatInstanceId={chatInstanceId}
          chatResponseId={chatResponseId}
          initialMessages={initialMessages}
        />
      </Suspense>
    </ErrorBoundary>
  );
}

// Error boundary component to catch and display errors
class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  onError: (error: Error) => void;
}> {
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    return this.props.children;
  }
}