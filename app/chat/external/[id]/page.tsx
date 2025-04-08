"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { WelcomeForm } from "@/components/welcome-form";
import { Loader2, Shield, ArrowRight, Gift } from "lucide-react";
import { useConsolidatedChatInit } from "@/lib/hooks/use-consolidated-chat-init";
import { usePromptWarmup } from "@/lib/hooks/use-prompt-warmup";
import { useQuotaAvailability } from "@/hooks/use-quota-availability";
import { Button } from "@/components/ui/button";
import Head from "next/head";
import Image from "next/image";
import { cn } from "@/lib/utils";

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

// Define structure for branding data from API
interface BrandingData {
  logoUrl?: string | null;
  buttonColor?: string | null;
  titleColor?: string | null;
}

// Update state type to include branding
interface ChatInstanceData {
  welcomeDescription?: string;
  welcomeHeading?: string;
  welcomeCardDescription?: string;
  respondentContacts?: boolean;
  incentive_status?: boolean;
  incentive_description?: string;
  branding?: BrandingData | null; // Add branding object
}

// Define default branding colors
const DEFAULT_BUTTON_COLOR = '#4f46e5'; // Default indigo
const DEFAULT_TITLE_COLOR = null; // Use null for default gradient style

export default function StartChatPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [chatInstanceData, setChatInstanceData] = useState<ChatInstanceData | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [chatNotFound, setChatNotFound] = useState(false);
  
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

  // Initial load - fetch instance data
  useEffect(() => {
    async function fetchInstanceData() {
      setIsLoading(true); // Start loading indicator
      try {
        console.log(`Fetching chat instance data for ID: ${id}`);

        // This API call now needs to return the branding object as well
        const response = await fetch(`/api/chat-instances/${id}`);

        if (!response.ok) {
          console.warn(`Chat instance fetch failed with status ${response.status}`);
          if (response.status === 404) {
            setChatNotFound(true);
            setChatInstanceData({}); // Keep as empty object for not found state
          } else {
            // Fallback for other errors - ensure branding is null
            setChatInstanceData({
              welcomeDescription: "Welcome to this conversation. We appreciate your time and feedback!",
              welcomeHeading: "Ready to share your feedback?",
              welcomeCardDescription: "This is a brief chat with our AI assistant. Thank you for your time.",
              respondentContacts: false,
              incentive_status: false,
              incentive_description: "",
              branding: null, // Explicitly set branding to null on fallback
            });
          }
        } else {
          const chatInstance: ChatInstanceData = await response.json(); // Expect ChatInstanceData structure
          console.log("Fetched chat instance data:", chatInstance);
          setChatInstanceData(chatInstance);
        }
      } catch (error) {
        console.error('Failed to fetch chat instance:', error);
        // Fallback on fetch error - ensure branding is null
        setChatInstanceData({
          welcomeDescription: "Welcome to this conversation. We appreciate your time and feedback!",
          welcomeHeading: "Ready to share your feedback?",
          welcomeCardDescription: "This is a brief chat with our AI assistant. Thank you for your time.",
          respondentContacts: false,
          incentive_status: false,
          incentive_description: "",
          branding: null, // Explicitly set branding to null on fetch error
        });
      } finally {
        setIsLoading(false); // Stop loading indicator
      }
    }

    // Only fetch if we don't have the data yet
    if (!chatInstanceData && !chatNotFound) { // Also check chatNotFound
       fetchInstanceData();
    } else if (chatNotFound) {
       setIsLoading(false); // Ensure loading stops if chat was already marked as not found
    }
  }, [chatInstanceData, id, chatNotFound]); // Add chatNotFound dependency

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

  // --- Determine effective branding colors ---
  const logoUrl = chatInstanceData?.branding?.logoUrl;
  const customButtonColor = chatInstanceData?.branding?.buttonColor;
  const customTitleColor = chatInstanceData?.branding?.titleColor;

  const buttonColor = customButtonColor || DEFAULT_BUTTON_COLOR;
  const titleColor = customTitleColor; // Keep null if not set, to trigger gradient
  const useGradientButton = !customButtonColor;
  const useGradientTitle = !customTitleColor;

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
      <Card className="max-w-md w-full bg-white shadow-lg relative overflow-hidden">
        <CardHeader className="text-center pt-8 pb-6">
          {logoUrl && (
            <div className="mb-4 flex justify-center">
              <Image
                src={logoUrl}
                alt="Company Logo"
                width={120}
                height={40}
                style={{ objectFit: 'contain', maxHeight: '40px' }}
                priority
              />
            </div>
          )}

          <h1 className={cn(
              "text-2xl font-bold",
              useGradientTitle && "bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent"
            )}
            style={{ color: titleColor || undefined }}
          >
            {chatNotFound
              ? "Chat Unavailable"
              : (hasReachedResponseLimit
                ? "Response Limit Reached"
                : (chatInstanceData?.welcomeHeading || "Ready to share your feedback?"))}
          </h1>
        </CardHeader>
        
        <CardContent>
          {chatNotFound ? (
            <p className="text-gray-600 text-center">
              This chat is no longer available for participation. Thank you.
            </p>
          ) : hasReachedResponseLimit ? (
            <p className="text-gray-600 text-center">
              Thank you for your interest—this conversation has reached its response limit and is no longer accepting new submissions.
            </p>
          ) : (
            <>
              <div className="border border-gray-200 bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-center text-sm text-gray-600">
                  {chatInstanceData?.welcomeCardDescription || 
                    "This is a brief chat with our AI assistant. It involves a few quick questions and should only take a minute of your time."}
                </p>
              </div>
              
              {errorMessage && (
                <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm mb-4">
                  {errorMessage}
                </div>
              )}
            
              {chatInstanceData?.respondentContacts ? (
                <WelcomeForm 
                  onSubmit={handleStartChat}
                  isLoading={isInitializing}
                  incentive_status={chatInstanceData.incentive_status}
                  incentive_description={chatInstanceData.incentive_description}
                  buttonColor={buttonColor}
                  useGradientButton={useGradientButton}
                />
              ) : !hasReachedResponseLimit && (
                <div className="flex flex-col space-y-4">
                  {chatInstanceData?.incentive_status && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-2">
                      <div className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-indigo-500" />
                        <p className="text-sm text-gray-700">
                          {chatInstanceData?.incentive_description || "Complete this conversation to receive an incentive!"}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center">
                    <Shield size={14} className="text-gray-500 mr-2" />
                    <p className="text-sm text-gray-500">Your feedback is anonymous</p>
                  </div>
                  
                  <Button
                    onClick={() => handleStartChat()}
                    disabled={isInitializing}
                    className={cn(
                      "w-full text-white py-6",
                      useGradientButton && "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    )}
                    style={{ backgroundColor: !useGradientButton ? buttonColor : undefined }}
                  >
                    {isInitializing ? "Preparing Your Session..." : "Start Chatting"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center pb-6">
          <div className="text-center text-xs text-gray-500">
            powered by <a href="https://franko.ai" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-500">franko.ai</a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 