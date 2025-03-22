"use client"

import { useState, useEffect, useCallback, useMemo, Suspense, lazy } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit2, Trash2, Loader2, RefreshCcw, AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import dynamic from "next/dynamic"
import type { ConversationPlan } from "@/components/conversationPlanSchema"
import { NavSidebar } from "@/components/nav-sidebar"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import React from "react"
import { useQuotaAvailability } from "@/hooks/use-quota-availability"

// Dynamically import components for each tab to reduce initial bundle size
const ShareableLink = dynamic(
  () => import("@/components/shareable-link").then(mod => ({ default: mod.ShareableLink })),
  {
    loading: () => <LoadingPlaceholder />,
    ssr: false
  }
)

const ConversationPlanForm = dynamic(
  () => import("@/components/conversation-plan-form"),
  {
    loading: () => <LoadingPlaceholder />,
    ssr: false
  }
)

const ConversationResponses = dynamic(
  () => import("@/components/conversation-responses").then(mod => ({ default: mod.ConversationResponses })),
  {
    loading: () => <LoadingPlaceholder />,
    ssr: false
  }
)

const EmailNotificationSetting = dynamic(
  () => import("@/components/email-notification-setting").then(mod => ({ default: mod.EmailNotificationSetting })),
  {
    loading: () => <LoadingPlaceholder />,
    ssr: false
  }
)

const IncentiveSetting = dynamic(
  () => import("@/components/incentive-setting").then(mod => ({ default: mod.IncentiveSetting })),
  {
    loading: () => <LoadingPlaceholder />,
    ssr: false
  }
)

// Loading placeholder for lazy-loaded components
const LoadingPlaceholder = () => (
  <div className="w-full p-4 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
      <p className="mt-2 text-sm text-muted-foreground">Loading content...</p>
    </div>
  </div>
)

interface ConversationPageClientProps {
  params: {
    guideName: string
  }
  userId: string
}

export const ConversationPageClient = React.memo(function ConversationPageClient({ params, userId }: ConversationPageClientProps) {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const fromParam = searchParams.get('from')
  const [activeTab, setActiveTab] = useState(tabParam || "plan")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [conversationPlan, setConversationPlan] = useState<ConversationPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // The guideName param is actually the chat instance ID
  const chatId = params.guideName

  // Check if we're coming from regeneration
  const isFromRegenerate = fromParam === 'regenerate'

  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tabParam && ['share', 'plan', 'responses', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Memoize the updateLastViewed function
  const updateLastViewed = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat-instances/${chatId}/last-viewed`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        // Try to get more specific error message from the response
        let errorMessage = 'Failed to update last viewed timestamp';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse the error, use the default message
        }
        
        console.error(errorMessage);
      }
    } catch (error) {
      console.error('Error updating last viewed timestamp:', error);
    }
  }, [chatId]);

  // Update lastViewed timestamp when the user views the responses tab
  useEffect(() => {
    if (activeTab === 'responses') {
      updateLastViewed();
    }
  }, [activeTab, updateLastViewed]);

  useEffect(() => {
    async function loadConversationPlan() {
      try {
        setIsLoading(true);
        
        // Check if we should use localStorage data first
        const useLocal = searchParams.get('useLocal') === 'true';
        let localPlanData = null;
        
        if (useLocal) {
          try {
            const storedData = localStorage.getItem(`plan_${chatId}`);
            if (storedData) {
              const parsed = JSON.parse(storedData);
              // Only use fresh data (less than 10 minutes old)
              if (parsed.data && Date.now() - parsed.timestamp < 600000) {
                localPlanData = parsed.data;
                setConversationPlan(localPlanData);
              }
            }
          } catch (e) {
            console.error('Error reading from localStorage:', e);
          }
        }
        
        // Always try API fetch (either as backup or to update localStorage)
        const response = await fetch(`/api/conversation-plan?chatId=${chatId}`);
        
        if (response.ok) {
          const plan = await response.json();
          setConversationPlan(plan);
        } else if (!localPlanData) {
          // Only show error if we don't have localStorage data
          let errorMessage = 'Failed to load conversation plan';
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            // If we can't parse the error, use the default message
          }
          
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error("Error loading conversation plan:", error);
        if (!conversationPlan) { // Only show toast if we have no data at all
          const errorMessage = error instanceof Error ? error.message : 'Failed to load conversation plan';
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadConversationPlan();
  }, [chatId, toast, searchParams]);

  // Memoize handleDelete function
  const handleDelete = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat-instances/${chatId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        // Try to get more specific error message from the response
        let errorMessage = 'Failed to delete conversation';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse the error, use the default message
        }
        
        throw new Error(errorMessage);
      }
      
      toast({
        title: "Success",
        description: "Conversation deleted successfully",
      });
      
      // Redirect to workspace page after successful deletion
      router.push('/workspace');
    } catch (error) {
      console.error("Error deleting conversation:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete conversation';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      setShowDeleteDialog(false);
    }
  }, [chatId, toast, router]);

  // Memoize handleRename function
  const handleRename = useCallback(async () => {
    // Get the current title
    const currentTitle = conversationPlan?.title || "Untitled Conversation";
    
    // Prompt the user for a new title
    const newTitle = window.prompt("Enter a new title for this conversation:", currentTitle);
    
    // If the user cancels or enters an empty title, do nothing
    if (!newTitle || newTitle.trim() === '') {
      return;
    }
    
    try {
      const response = await fetch(`/api/chat-instances/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });
      
      if (!response.ok) {
        // Try to get more specific error message from the response
        let errorMessage = 'Failed to rename conversation';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse the error, use the default message
        }
        
        throw new Error(errorMessage);
      }
      
      // Update the conversation plan with the new title
      if (conversationPlan) {
        setConversationPlan({
          ...conversationPlan,
          title: newTitle,
        });
      }
      
      toast({
        title: "Success",
        description: "Conversation renamed successfully",
      });
    } catch (error) {
      console.error("Error renaming conversation:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to rename conversation';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [chatId, conversationPlan, toast]);

  // Memoize handleConversationPlanSubmit function
  const handleConversationPlanSubmit = useCallback(async (data: ConversationPlan) => {
    try {
      const response = await fetch(`/api/conversation-plan?chatId=${chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        // Try to get more specific error message from the response
        let errorMessage = 'Failed to save conversation plan';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse the error, use the default message
        }
        
        throw new Error(errorMessage);
      }
      
      setConversationPlan(data);
      
      toast({
        title: "Success",
        description: "Conversation plan saved successfully",
      });
    } catch (error) {
      console.error("Error saving conversation plan:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save conversation plan';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [chatId, toast]);

  // State for responses data
  const [responsesData, setResponsesData] = useState({
    responses: 0,
    totalCustomerWords: 0,
    completionRate: 0,
    responseData: [],
  });

  // Fetch chat responses
  useEffect(() => {
    async function fetchChatResponses() {
      try {
        if (activeTab === 'responses') {
          setIsLoading(true);
          
          const response = await fetch(`/api/chat-instances/${chatId}/responses`);
          
          if (!response.ok) {
            let errorMessage = 'Failed to fetch chat responses';
            try {
              const errorData = await response.json();
              if (errorData.error) {
                errorMessage = errorData.error;
              }
            } catch (e) {
              // If we can't parse the error, use the default message
            }
            
            throw new Error(errorMessage);
          }
          
          const data = await response.json();
          
          // Transform the data to match the expected format
          const formattedResponses = data.responses.map((resp: any) => ({
            name: resp.intervieweeFirstName && resp.intervieweeSecondName 
              ? `${resp.intervieweeFirstName} ${resp.intervieweeSecondName}`
              : resp.intervieweeFirstName || 'Anonymous',
            email: resp.intervieweeEmail || 'No email provided',
            completionRate: resp.completionStatus 
              ? parseInt(resp.completionStatus.replace('%', ''), 10) 
              : 0,
            completionDate: resp.interviewEndTime 
              ? new Date(resp.interviewEndTime).toISOString().split('T')[0]
              : new Date(resp.updatedAt).toISOString().split('T')[0],
            summary: resp.transcript_summary || '',
            transcript: resp.cleanTranscript || '',
            customerWords: parseInt(resp.user_words || '0', 10),
          }));
          
          // Sort by most recent first
          formattedResponses.sort((a: any, b: any) => 
            new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime()
          );
          
          // Calculate aggregate stats
          const totalWords = formattedResponses.reduce((total: number, resp: any) => {
            return total + (resp.customerWords || 0);
          }, 0);
          
          const avgCompletionRate = formattedResponses.length > 0
            ? formattedResponses.reduce((sum: number, resp: any) => sum + resp.completionRate, 0) / formattedResponses.length
            : 0;
          
          setResponsesData({
            responses: formattedResponses.length,
            totalCustomerWords: totalWords,
            completionRate: avgCompletionRate,
            responseData: formattedResponses,
          });
        }
      } catch (error) {
        console.error('Error fetching chat responses:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load conversation responses",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    if (activeTab === 'responses') {
      fetchChatResponses();
    }
  }, [chatId, activeTab, toast]);
  
  // Add quota availability check
  const { hasAvailablePlanQuota, isLoading: isQuotaLoading } = useQuotaAvailability();

  return (
    <NavSidebar>
      <div className="w-full p-4 md:p-8 lg:p-12 space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="overflow-hidden mr-4">
            <h1 className="text-2xl font-semibold text-black overflow-hidden text-ellipsis whitespace-nowrap">
              {conversationPlan?.title || "Untitled Conversation"}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/user_avatar-P2kgEUysCcRUdgA5eE93X7hWpXLVKx.svg"
              alt="User avatar"
              className="h-8 w-8"
            />
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline" size="icon" className="h-8 w-8 border-gray-200">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-500"
                  >
                    <path
                      d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleRename}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0">
            <TabsTrigger
              value="share"
              className="group relative rounded-none border-b-2 border-transparent px-4 h-12 data-[state=active]:border-black data-[state=active]:shadow-none transition-colors duration-200 ease-in-out"
            >
              <span className="relative z-10 p-2 rounded-lg group-hover:bg-gray-100">Share</span>
            </TabsTrigger>
            <TabsTrigger
              value="plan"
              className="group relative rounded-none border-b-2 border-transparent px-4 h-12 data-[state=active]:border-black data-[state=active]:shadow-none transition-colors duration-200 ease-in-out"
            >
              <span className="relative z-10 p-2 rounded-lg group-hover:bg-gray-100">Plan</span>
            </TabsTrigger>
            <TabsTrigger
              value="responses"
              className="group relative rounded-none border-b-2 border-transparent px-4 h-12 data-[state=active]:border-black data-[state=active]:shadow-none transition-colors duration-200 ease-in-out"
            >
              <span className="relative z-10 p-2 rounded-lg group-hover:bg-gray-100">Responses</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="group relative rounded-none border-b-2 border-transparent px-4 h-12 data-[state=active]:border-black data-[state=active]:shadow-none transition-colors duration-200 ease-in-out"
            >
              <span className="relative z-10 p-2 rounded-lg group-hover:bg-gray-100">Settings</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="share" className="mt-10">
            <Suspense fallback={<LoadingPlaceholder />}>
              <ShareableLink guideName={chatId} />
            </Suspense>
          </TabsContent>
          <TabsContent value="plan" className="mt-10">
            <Card className="rounded-[6px] border shadow-sm overflow-hidden bg-[#FAFAFA]">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                  <div className="w-full md:max-w-[70%] mb-4 md:mb-0">
                    <h2 className="text-2xl font-semibold mb-2 flex items-center">
                      Conversation Plan
                      <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>
                    </h2>
                    <p className="text-sm text-gray-500">
                      Use this space to review and edit your Conversation Plan. It provides the necessary context and learning objectives that will guide your agent during conversations.
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                  <Button 
                    onClick={() => router.push(`/create/${chatId}?regenerate=true`)}
                      disabled={isQuotaLoading || !hasAvailablePlanQuota}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm px-3 py-1.5 transition-all duration-200 md:ml-4 self-start md:self-auto flex items-center gap-1"
                  >
                      {isQuotaLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
                      <span>
                        {isQuotaLoading ? "Loading..." : (!hasAvailablePlanQuota) ? "⚠️ You're out of generation credits!" : "Regenerate"}
                      </span>
                  </Button>
                    {!isQuotaLoading && !hasAvailablePlanQuota && (
                      <div className="mt-2 text-amber-500 text-xs flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        <span>You've reached your plan generation limit</span>
                      </div>
                    )}
                  </div>
                </div>
                <Suspense fallback={<LoadingPlaceholder />}>
                  <ConversationPlanForm 
                    chatId={chatId} 
                    onSubmit={handleConversationPlanSubmit} 
                    initialData={conversationPlan}
                    startInEditMode={isFromRegenerate}
                  />
                </Suspense>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="responses" className="mt-10">
            <Suspense fallback={<LoadingPlaceholder />}>
              <ConversationResponses
                responses={responsesData.responses}
                totalCustomerWords={responsesData.totalCustomerWords}
                completionRate={responsesData.completionRate}
                responseData={responsesData.responseData}
                chatInstanceId={chatId}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="settings" className="mt-10">
            <Card className="rounded-[6px] border bg-[#FAFAFA] shadow-sm">
              <div className="p-6 space-y-6">
                <div className="bg-white rounded-[6px] shadow-sm">
                  <Suspense fallback={<LoadingPlaceholder />}>
                    <EmailNotificationSetting />
                  </Suspense>
                </div>
                <div className="bg-white rounded-[6px] shadow-sm">
                  <Suspense fallback={<LoadingPlaceholder />}>
                    <IncentiveSetting />
                  </Suspense>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>This will also delete all of your conversation responses.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </NavSidebar>
  )
});