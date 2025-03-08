"use client"

import React, { Suspense, useState } from "react"
import { Message } from "ai"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Dynamically import the InternalChat component for code splitting
const InternalChat = dynamic(
  () => import("@/components/internal-chat").then((mod) => ({ default: mod.InternalChat })),
  {
    loading: () => (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="text-sm text-gray-500 mt-2">Preparing analysis interface...</p>
      </div>
    ),
    ssr: false,
  }
)

interface InternalChatWrapperProps {
  internalChatSessionId: string;
  initialMessages: Message[];
}

export function InternalChatWrapper({
  internalChatSessionId,
  initialMessages,
}: InternalChatWrapperProps) {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState<any>(null);

  const handleError = (error: Error) => {
    console.error("Error in InternalChat:", error);
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
          We encountered an error while loading the analysis interface. Please try refreshing the page or contact support if the problem persists.
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
            <p className="text-sm text-gray-500 mt-2">Loading analysis interface...</p>
          </div>
        }
      >
        <InternalChat
          internalChatSessionId={internalChatSessionId}
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