"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { WelcomeForm } from "@/components/welcome-form";
import { Loader2 } from "lucide-react";
import { useConsolidatedChatInit } from "@/lib/hooks/use-consolidated-chat-init";
import { usePromptWarmup } from "@/lib/hooks/use-prompt-warmup";
import { useQuotaAvailability } from "@/hooks/use-quota-availability";
import Head from "next/head";

// Custom hook to prevent zooming on mobile
const usePreventZoom = () => {
  useEffect(() => {
    // Create a meta tag to prevent zooming
    const metaTag = document.createElement('meta');
    metaTag.name = 'viewport';
    metaTag.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
    
    // Find any existing viewport meta tags
    const existingMetaTag = document.querySelector('meta[name="viewport"]');
    
    if (existingMetaTag) {
      // Update existing meta tag
      existingMetaTag.setAttribute('content', metaTag.content);
    } else {
      // Add new meta tag
      document.head.appendChild(metaTag);
    }
    
    // Cleanup - restore original meta tag on unmount
    return () => {
      if (existingMetaTag) {
        existingMetaTag.setAttribute('content', 'width=device-width, initial-scale=1');
      } else if (document.head.contains(metaTag)) {
        document.head.removeChild(metaTag);
      }
    };
  }, []);
};

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
    incentive_status?: boolean;
    incentive_description?: string;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  
  // Start warming the prompt cache as early as possible
  // This happens in parallel with other data fetching
  // and ensures the prompt is ready by the time the user interacts
  usePromptWarmup(id);
  
  // Use consolidated initialization hook that handles both
  // chat instance retrieval and chat response creation in a single API call
  const { 
    mutate: initializeChat, 
    isPending: isInitializing, 
    error: initError,
    data: initData
  } = useConsolidatedChatInit();

  // Fetch quota availability to check response limits
  const { isLoading: isQuotaLoading, hasAvailableResponsesQuota } = useQuotaAvailability();

  // Use the zoom prevention hook
  usePreventZoom();

  // Detect mobile and Safari
  useEffect(() => {
    // Check if mobile
    setIsMobile(window.innerWidth < 768);
    
    // Detect Safari
    const ua = navigator.userAgent.toLowerCase();
    setIsSafari(
      /safari/.test(ua) && 
      !/chrome/.test(ua) && 
      !/firefox/.test(ua) &&
      !/edg/.test(ua)
    );
    
    // Handle resize events
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent pull-to-refresh and pinch zooming
  useEffect(() => {
    // Apply fixed positioning to prevent pull-to-refresh
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.overscrollBehavior = 'none';
    
    // Prevent pinch zoom
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    
    // Prevent pull-to-refresh
    const preventPullToRefresh = (e: TouchEvent) => {
      if (isSafari) {
        // More aggressive prevention for Safari
        const touchY = e.touches[0].clientY;
        if (touchY < 150) {
          e.preventDefault();
        }
      } else {
        // Other browsers
        const touchY = e.touches[0].clientY;
        if (touchY < 50 && e.type === 'touchstart') {
          e.preventDefault();
        }
      }
    };
    
    // Prevent gesture events in Safari
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };
    
    // Add event listeners
    document.addEventListener('touchstart', preventPullToRefresh, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });
    // @ts-ignore - TypeScript doesn't recognize gesturestart
    document.addEventListener('gesturestart', preventGesture, { passive: false });
    
    return () => {
      // Clean up
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.overscrollBehavior = '';
      
      document.removeEventListener('touchstart', preventPullToRefresh);
      document.removeEventListener('touchmove', preventZoom);
      // @ts-ignore
      document.removeEventListener('gesturestart', preventGesture);
    };
  }, [isSafari]);

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
            respondentContacts: false,
            incentive_status: false,
            incentive_description: ""
          });
        } else {
          const chatInstance = await response.json();
          console.log("Fetched chat instance data:", chatInstance);
          
          // Set the instance data from the response
          setChatInstanceData(chatInstance);
          
          // Debug log to check incentive data
          console.log("Incentive data:", {
            status: chatInstance.incentive_status,
            description: chatInstance.incentive_description,
            code: chatInstance.incentive_code
          });
        }
      } catch (error) {
        console.error('Failed to fetch chat instance:', error);
        // Provide fallback data even when exceptions occur
        setChatInstanceData({
          welcomeDescription: "Welcome to this conversation. We appreciate your time and feedback!",
          respondentContacts: false,
          incentive_status: false,
          incentive_description: ""
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
    // Only block if we definitely know there's no quota available
    // In incognito/unauthenticated scenarios, proceed anyway
    if (!isQuotaLoading && hasAvailableResponsesQuota === false) {
      console.log("Response limit reached, not starting chat");
      return;
    }
    
    // Now we have user data, get a real chat response ID
    initializeChat(
      { 
        chatInstanceId: id, 
        userData: formData 
      },
      {
        onSuccess: (data) => {
          setIsNavigating(true);
          const welcomeDesc = chatInstanceData?.welcomeDescription ? 
            encodeURIComponent(chatInstanceData.welcomeDescription) : '';
          router.push(`/chat/external/${id}/active?responseId=${data.chatResponseId}&welcomeDesc=${welcomeDesc}`);
        },
      }
    );
  };

  // Determine if we should show the response limit message
  // Modified to assume quota is available when in unauthenticated context (like incognito mode)
  const hasReachedResponseLimit = !isLoading && !isQuotaLoading && 
    (isQuotaLoading === false && hasAvailableResponsesQuota === false);
    
  // Create fade-in effect CSS style for smoother transitions
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (!isLoading) {
      // Short delay before starting the fade-in (feels more natural)
      const timer = setTimeout(() => {
        setVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);
  
  const fadeStyle = {
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.5s ease-in-out'
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#F9F8F6]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Navigating state
  if (isNavigating) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#F9F8F6]">
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
    <div 
      className="h-[100dvh] w-full bg-[#F9F8F6] flex items-center justify-center p-4 overflow-hidden"
      style={{ 
        touchAction: "manipulation",
        position: isSafari ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: "touch",
        WebkitTouchCallout: "none",
        ["WebkitOverscrollBehavior" as any]: "none",
        ...fadeStyle
      }}
    >
      <Card className="max-w-lg w-full p-8 bg-white shadow-lg">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">
              {hasReachedResponseLimit ? "Response Limit Reached" : "Welcome! Ready to Chat?"}
            </h1>
            {hasReachedResponseLimit ? (
              <p className="text-gray-600">
                Thank you for your interest—this conversation has reached its response limit and is no longer accepting new submissions.
              </p>
            ) : (
              <p className="text-gray-600">
                {chatInstanceData?.welcomeDescription || 
                  "This will be a brief 3-4 minute chat to share your thoughts on Clerk.com's onboarding and documentation. Your feedback will help make the experience even better for developers like you!"}
              </p>
            )}
          </div>
          
          {errorMessage && !hasReachedResponseLimit && (
            <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">
              {errorMessage}
            </div>
          )}
          
          {!hasReachedResponseLimit && chatInstanceData?.respondentContacts ? (
            <WelcomeForm 
              onSubmit={handleStartChat}
              isLoading={isInitializing}
              incentive_status={chatInstanceData.incentive_status}
              incentive_description={chatInstanceData.incentive_description}
            />
          ) : !hasReachedResponseLimit ? (
            <div className="flex justify-center">
              <button
                onClick={() => handleStartChat()}
                disabled={isInitializing}
                className={`
                  w-full max-w-sm bg-gradient-to-r from-blue-500 to-indigo-600 
                  hover:from-blue-600 hover:to-indigo-700 text-white
                  py-3 px-4 rounded-lg transition-all duration-200 shadow-sm
                  disabled:opacity-50 disabled:cursor-not-allowed text-base
                `}
                style={{ fontSize: '16px', minHeight: '48px' }}
              >
                {isInitializing ? "Preparing Your Session..." : "Get Started"}
              </button>
            </div>
          ) : null}
          
          <div className="text-center text-sm text-gray-400 mt-4">
            powered by franko.ai
          </div>
        </div>
      </Card>
    </div>
  );
} 