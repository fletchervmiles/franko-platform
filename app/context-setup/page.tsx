"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Globe, Building, InfoIcon, Edit, Check, PlusCircle, RefreshCw, Link, Tag, Palette, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { NavSidebar } from "@/components/nav-sidebar"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { getProfileByUserId } from "@/db/queries/profiles-queries"
import { useToast } from "@/hooks/use-toast"
import { ContextContainer } from "@/components/context-container"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useProfile } from "@/components/contexts/profile-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import ProcessingSteps from "@/components/onboarding/processing-steps"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { AgentTrainingCenter } from "@/components/agent-training-center"
// import { useSetupChecklist } from "@/contexts/setup-checklist-context";

const contextSetupSchema = z.object({
  url: z.string()
    .min(1, { message: "URL is required" })
    .refine(val => {
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
      const domain = val.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
      return domainRegex.test(domain);
    }, { message: "Please enter a valid website address (e.g., company.com)" })
    .transform(val => {
      if (!/^https?:\/\//i.test(val)) {
        return `https://${val}`
      }
      return val;
    }),
  orgName: z.string().min(1, { message: "Organisation name is required" }),
})

type ContextSetupValues = z.infer<typeof contextSetupSchema>

// Processing step configurations
const REGENERATE_CONTEXT_STEPS = [
  { name: 'Extracting website content', status: 'waiting' as const },
  { name: 'Generating AI knowledge base', status: 'waiting' as const },
  { name: 'Updating knowledge base', status: 'waiting' as const },
  { name: 'Retraining all agents', status: 'waiting' as const }
]

const REGENERATE_AGENTS_STEPS = [
  { name: 'Updating agent conversation plans', status: 'waiting' as const }
]

// Processing configuration
const getProcessingConfig = (isRegeneratingContext: boolean, isRegeneratingAgents: boolean) => {
  if (isRegeneratingContext) {
    return {
      title: "Updating your context",
      subtitle: "Re-extracting website content and retraining agents. This ensures your agents have the latest information.",
      steps: REGENERATE_CONTEXT_STEPS,
      completionMessage: "Context updated and agents retrained successfully! Your agents now have the latest knowledge."
    }
  } else if (isRegeneratingAgents) {
    return {
      title: "Updating your agents", 
      subtitle: "Retraining agents with current context. Your existing modals and share links will continue working.",
      steps: REGENERATE_AGENTS_STEPS,
      completionMessage: "Agents retrained successfully! They're now updated with your current context."
    }
  }
  
  // Fallback (shouldn't happen)
  return {
    title: "Processing...",
    subtitle: "Please wait while we complete your request.",
    steps: [],
    completionMessage: "Operation completed successfully!"
  }
}

// Query functions
const fetchProfile = async (userId: string) => {
  const profile = await getProfileByUserId(userId)
  return profile
}

const fetchUserStats = async () => {
  const response = await fetch('/api/stats')
  if (!response.ok) {
    throw new Error('Failed to fetch user stats')
  }
  return response.json()
}

const submitContext = async (data: {
  userId: string,
  organisationUrl: string,
  organisationName: string
}) => {
  const response = await fetch('/api/context', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const result = await response.json()
    throw new Error(result.error || 'Failed to update context')
  }
  return response.json()
}

const saveField = async (data: {
  userId: string,
  organisationUrl?: string,
  organisationName?: string
}) => {
  const response = await fetch('/api/context', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const result = await response.json()
    throw new Error(result.error || 'Failed to update field')
  }
  return response.json()
}

const LoadingPlaceholder = () => (
  <div className="w-full p-4 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary/70" />
      <p className="mt-2 text-xs text-muted-foreground">Loading...</p>
    </div>
  </div>
);

function ContextSetupInnerPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isCardEditing, setIsCardEditing] = useState(false)
  const [submittedValues, setSubmittedValues] = useState<ContextSetupValues | null>(null)
  const [shouldPulse, setShouldPulse] = useState(false)
  const [showManualContext, setShowManualContext] = useState(false)
  const { toast } = useToast()
  const [description, setDescription] = useState<string>("")
  const contextContainerRef = useRef<HTMLDivElement>(null)
  const { profile, isLoading: isLoadingProfile, setHighlightWorkspaceNavItem, isCompanyComplete, setIsCompanyComplete, isBrandingComplete, setIsBrandingComplete } = useProfile()
  const [activeTab, setActiveTab] = useState("organization")
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isPlanRegenerating, setIsPlanRegenerating] = useState(false)
  const [contextComplete, setContextComplete] = useState(false)
  const [agentsComplete, setAgentsComplete] = useState(false)
  // const { progress: setupProgress, refetchStatus: refetchSetupStatus } = useSetupChecklist();

  // Additional queries for agent training center
  const { data: userStats } = useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: fetchUserStats,
    enabled: !!user?.id
  })

  const chatInstancesCount = userStats?.chatInstancesCount || 0
  const modalCount = userStats?.modalCount || 0
  const agentsWithPlans = userStats?.agentsWithPlans || 0

  const form = useForm<ContextSetupValues>({
    resolver: zodResolver(contextSetupSchema),
    defaultValues: {
      url: "",
      orgName: "",
    },
  })

  const { watch } = form
  const url = watch("url")
  const orgName = watch("orgName")

  const { mutate, isPending } = useMutation({
    mutationFn: submitContext,
    onSuccess: (data) => {
      // Production debugging
      console.log('Context generation succeeded, response:', JSON.stringify(data));
      
      if (data && data.description) {
        console.log('Setting description in cache:', data.description.substring(0, 50) + '...');
        queryClient.setQueryData(queryKeys.profile(user?.id), (old: any) => {
          if (!old) return old;
          // Preserve ALL existing fields, only update description-related fields
          return {
            ...old,
            organisationDescription: data.description,
            organisationDescriptionCompleted: true,
            // Explicitly preserve critical fields that might be lost in race conditions
            organisationName: old.organisationName,
            organisationUrl: old.organisationUrl,
          };
        });
        setDescription(data.description);
        setShowManualContext(true);
      } else {
        console.warn('Context generation succeeded but no description returned');
      }
      
      setSubmittedValues({
        url: profile?.organisationUrl || form.getValues("url"),
        orgName: profile?.organisationName || form.getValues("orgName")
      })
      setIsCardEditing(false)

      // Invalidate profile first, then setup status
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(user?.id), refetchType: 'active' })
        .then(() => {
          console.log('Profile invalidated, now refetching setup status...');
          // refetchSetupStatus();
        })
        .catch(error => {
          console.error('Error during sequential refetch operations:', error);
        });

      toast({
        title: "Success!",
        description: "Your context has been generated successfully.",
      })
      
      // router.refresh(); // Temporarily commented out to isolate its effect

      setLoadingProgress(0)
      // refetchSetupStatus(); // Moved into the .then() chain

      // Step 2: regenerate all existing plans - this will complete when agents finish
      regenerateAllPlans().then(() => {
        // Mark context as complete for processing steps only after agents are done
        setContextComplete(true)
      }).catch(() => {
        // If agent regeneration fails, still mark context as complete since context generation succeeded
        setContextComplete(true)
      })
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update context. Please try again.",
      })
      setLoadingProgress(0)
      setContextComplete(false)
    }
  })

  const { mutate: saveCardEditsMutation, isPending: isSavingCardEdits } = useMutation({
    mutationFn: saveField,
    onSuccess: (data) => {
      if (data.organisationUrl !== undefined) {
        form.setValue("url", data.organisationUrl)
      }
      if (data.organisationName !== undefined) {
        form.setValue("orgName", data.organisationName)
      }
      setSubmittedValues({
        url: data.organisationUrl ?? (submittedValues?.url ?? ""),
        orgName: data.organisationName ?? (submittedValues?.orgName ?? "")
      })
      setIsCardEditing(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(user?.id), refetchType: 'active' })
      toast({
        title: "Success!",
        description: "Fields updated successfully.",
      })
      // refetchSetupStatus();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update fields. Please try again.",
      })
    }
  })

  // Dependency array includes profile, persona state, and loading flags
  useEffect(() => {
    if (profile) {
      form.setValue("url", profile.organisationUrl || "")
      form.setValue("orgName", profile.organisationName || "")
      setDescription(profile.organisationDescription || "")

      setSubmittedValues({
        url: profile.organisationUrl || "",
        orgName: profile.organisationName || ""
      })

      const companyDone = !!profile.organisationDescription;
      const brandingDone = !!(profile.logoUrl || profile.buttonColor || profile.titleColor);

      setIsCompanyComplete(companyDone);
      setIsBrandingComplete(brandingDone);

      if (!profile.organisationUrl && !profile.organisationName && !profile.organisationDescription) {
        setIsCardEditing(true)
      }
    } else {
       setIsCompanyComplete(false);
       setIsBrandingComplete(false);
    }
  }, [profile, form, setIsCompanyComplete, setIsBrandingComplete])

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  useEffect(() => {
    setShouldPulse((url?.length || 0) > 0 && (orgName?.length || 0) > 0 && !profile?.organisationDescription)
  }, [url, orgName, profile])

  // Effect for simulating loading progress
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isPending) {
      const startTime = Date.now()
      const duration = 60000 // 60 seconds

      setLoadingProgress(0); // Start from 0

      interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const newProgress = Math.min(100, Math.floor((elapsed / duration) * 100))
        setLoadingProgress(newProgress)

        if (newProgress >= 100) {
          clearInterval(interval)
          // Don't reset to 0 here, let mutation success/error handle it
        }
      }, 200) // Update every 200ms
    } else {
        // If mutation finishes early, ensure progress bar goes to 100
        // Only do this if it wasn't an error (onError resets to 0)
        // Check if submittedValues were set to infer success
        if (submittedValues?.url || submittedValues?.orgName) {
          setLoadingProgress(100);
        }
    }

    return () => clearInterval(interval)
  }, [isPending, submittedValues]) // Depend on isPending and submittedValues

  const onSubmit = async (data: ContextSetupValues) => {
    if (!user?.id) return
    // Triggered after AlertDialog confirmation
    mutate({
      userId: user.id,
      organisationUrl: data.url,
      organisationName: data.orgName,
    })
  }

  const handleSaveCardEdits = () => {
    if (!user?.id) return
    const urlValue = form.getValues("url")
    const nameValue = form.getValues("orgName")
    saveCardEditsMutation({
      userId: user.id,
      organisationUrl: urlValue,
      organisationName: nameValue
    })
  }

  const handleEditCard = () => {
    setIsCardEditing(true)
    setSubmittedValues({
        url: form.getValues("url"),
        orgName: form.getValues("orgName")
    })
  }

  const handleCancelCard = () => {
    setIsCardEditing(false)
    if (submittedValues) {
      form.setValue("url", submittedValues.url)
      form.setValue("orgName", submittedValues.orgName)
    }
    form.clearErrors()
  }

  const handleAddManualContext = () => {
    setShowManualContext(true)
    setTimeout(() => {
      contextContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const handleContextUpdated = async (updatedContext: string) => {
    console.log('Context updated via manual edit, description length:', updatedContext.length);
    setDescription(updatedContext)
    setIsCompanyComplete(!!updatedContext);
    
    // Optimistically update cache first for immediate UI feedback
    queryClient.setQueryData(queryKeys.profile(user?.id), (old: any) => {
      if (!old) return old;
      // Preserve ALL existing fields, only update description-related fields
      return {
        ...old,
        organisationDescription: updatedContext,
        organisationDescriptionCompleted: true,
        // Explicitly preserve critical fields that might be lost in race conditions
        organisationName: old.organisationName,
        organisationUrl: old.organisationUrl,
      };
    });
    
    // Then do the invalidation to get real server data
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.profile(user?.id), 
      refetchType: 'active' 
    });
    
    const freshProfile = queryClient.getQueryData(queryKeys.profile(user?.id)) as typeof profile
    if (!profile?.organisationDescriptionCompleted && freshProfile?.organisationDescriptionCompleted) {
      setHighlightWorkspaceNavItem(true)
    }
    
    // Update checklist status last
    // refetchSetupStatus();
  }

  const renderStatusDot = (isComplete: boolean) => (
    <span className={cn(
      "ml-2 h-2 w-2 rounded-full",
      isComplete ? "bg-green-500" : "bg-yellow-500"
    )}></span>
  );

  const regenerateAllPlans = async () => {
    try {
      setIsPlanRegenerating(true)
      setAgentsComplete(false) // Reset completion state
      
      const resp = await fetch('/api/context/regenerate-plans', { method: 'POST' })
      const result = await resp.json()
      if (!resp.ok) {
        throw new Error(result.error || 'Failed to regenerate plans')
      }
      
      toast({ title: 'Plans refreshed', description: `${result.regenerated} updated, ${result.failed?.length || 0} failed.` })
      
      // Mark agents as complete for processing steps
      setAgentsComplete(true)
      
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: ['userStats', user?.id] })
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Plan regeneration failed' })
      setAgentsComplete(false)
    } finally {
      setIsPlanRegenerating(false)
    }
  }

  const handleRegenerateContext = () => {
    if (!user?.id) return
    // Reset completion states
    setContextComplete(false)
    setAgentsComplete(false)
    
    // Same as current regenerate - scrape website + retrain
    mutate({
      userId: user.id,
      organisationUrl: form.getValues("url"),
      organisationName: form.getValues("orgName"),
    })
  }

  const handleRegenerateAgents = () => {
    // New - just retrain with current context
    regenerateAllPlans()
  }

  const handleProcessingComplete = () => {
    // Reset states when user dismisses success modal
    setContextComplete(false)
    setAgentsComplete(false)
  }

  return (
    <NavSidebar>
      <div className="w-full p-4 md:p-8 lg:p-12">
        {(isPending || isPlanRegenerating) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
            <ProcessingSteps
              {...getProcessingConfig(isPending, isPlanRegenerating)}
              isComplete={isPending ? contextComplete : agentsComplete}
              onComplete={handleProcessingComplete}
            />
          </div>
        )}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            Context
          </h1>
        </div>

        {/* Agent Training Center - Above all other cards */}
        <AgentTrainingCenter
          userId={user?.id || ''}
          profile={profile}
          onRegenerateContext={handleRegenerateContext}
          onRegenerateAgents={handleRegenerateAgents}
          isRegeneratingContext={isPending}
          isRegeneratingAgents={isPlanRegenerating}
          chatInstancesCount={chatInstancesCount}
          modalCount={modalCount}
          agentsWithPlans={agentsWithPlans}
          hasUrl={!!form.watch("url")}
          hasContext={!!profile?.organisationDescription}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 mb-10">
             <TabsTrigger
                value="organization"
                className="group relative rounded-none border-b-2 border-transparent px-4 h-12 data-[state=active]:border-black data-[state=active]:shadow-none transition-colors duration-200 ease-in-out"
             >
               <span className="relative z-10 p-2 rounded-lg group-hover:bg-gray-100 flex items-center">
                 Company
                 {!isLoadingProfile && renderStatusDot(isCompanyComplete)}
               </span>
             </TabsTrigger>
          </TabsList>

          <TabsContent value="organization">
            <div className="space-y-6">
              <Card className="rounded-[6px] border bg-[#FAFAFA] shadow-sm">
                <CardHeader className="pb-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-semibold flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-full bg-[#F5FF78] flex items-center justify-center">
                            <Tag className="h-4 w-4 text-[#1C1617]" />
                          </div>
                          Company Details
                        </h2>
                        <p className="text-sm text-gray-500">Add your business details. This information builds the foundation for your AI Agents.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isCardEditing && (
                          <Button onClick={handleEditCard} variant="outline" size="sm" className="h-8 text-xs px-4">
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingProfile ? (
                     <div className="flex flex-col items-center space-y-2 py-4">
                       <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                       <p className="text-sm text-gray-500">Loading your profile...</p>
                     </div>
                   ) : isPending ? (
                     <div className="flex flex-col items-center space-y-6 py-8">
                       <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                       <div className="text-center space-y-2">
                         <p className="text-base font-semibold text-gray-900">
                           Creating context for your agents...
                         </p>
                         <p className="text-sm text-gray-500 px-4">
                           Fetching pages → extracting information → creating a structured document.
                           <br />
                           This usually takes under a minute.
                         </p>
                       </div>
                       <div className="w-full max-w-md px-4 pt-2">
                          <Progress
                             value={loadingProgress}
                             className="h-3 bg-gray-100 [&>div]:bg-[#E4F222]"
                          />
                         <div className="flex justify-between text-xs text-muted-foreground mt-1">
                           <span>Progress:</span>
                           <span>{loadingProgress}%</span>
                         </div>
                         {loadingProgress >= 100 && (
                           <p className="text-center text-sm text-amber-500 mt-3">
                             Almost ready! Please allow a few more moments for the process to complete.
                           </p>
                         )}
                       </div>
                     </div>
                   ) : (
                     <Form {...form}>
                       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                         <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                              <FormItem className="bg-white rounded-lg border transition-all duration-200 hover:border-gray-300 p-4">
                                <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-[#F5FF78] flex items-center justify-center">
                                    <Link className="h-3 w-3 text-[#1C1617]" />
                                  </div>
                                  Website URL
                                  <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <InfoIcon className="h-4 w-4 text-gray-500 cursor-pointer" />
                                      </TooltipTrigger>
                                      <TooltipContent side="top" align="center" className="bg-black text-white border-black max-w-xs p-2 rounded">
                                        <p>We scan publicly available information from this website to build the AI's foundational understanding of your products, services, and brand voice.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </FormLabel>
                                <p className="text-sm text-gray-500 mb-2">
                                  Primary source for automated context generation.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <FormControl className="w-full">
                                    <div className="relative w-full">
                                      <Input
                                        placeholder="https://yourcompany.com"
                                        className="bg-[#FAFAFA] disabled:bg-[#FAFAFA] disabled:text-gray-800 disabled:font-medium transition-colors duration-200"
                                        {...field}
                                        disabled={!isCardEditing || isSavingCardEdits}
                                      />
                                    </div>
                                  </FormControl>
                                </div>
                                {!field.value && !profile?.organisationUrl && (
                                  <p className="text-xs text-indigo-600 mt-1 font-medium">
                                    ✨ Enter your company URL to automatically generate context.
                                  </p>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="orgName"
                            render={({ field }) => (
                              <FormItem className="bg-white rounded-lg border transition-all duration-200 hover:border-gray-300 p-4">
                                <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-[#F5FF78] flex items-center justify-center">
                                    <Building className="h-3 w-3 text-[#1C1617]" />
                                  </div>
                                  Company or Product Name
                                  <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <InfoIcon className="h-4 w-4 text-gray-500 cursor-pointer" />
                                      </TooltipTrigger>
                                      <TooltipContent side="top" align="center" className="bg-black text-white border-black max-w-xs p-2 rounded">
                                        <p>Enter the official name your AI should use when referring to your business or primary offering.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </FormLabel>
                                <p className="text-sm text-gray-500 mb-2">
                                  Ensures your brand is referenced accurately.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <FormControl className="w-full">
                                    <div className="relative w-full">
                                      <Input
                                        placeholder="Your Company Inc."
                                        className="bg-[#FAFAFA] disabled:bg-[#FAFAFA] disabled:text-gray-800 disabled:font-medium transition-colors duration-200"
                                        {...field}
                                        disabled={!isCardEditing || isSavingCardEdits}
                                      />
                                    </div>
                                  </FormControl>
                                </div>
                                {!field.value && !profile?.organisationName && (
                                  <p className="text-xs text-indigo-600 mt-1 font-medium">
                                    ✨ Enter your company or product name.
                                  </p>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                         <div className="flex flex-wrap justify-end items-center gap-3 pt-2">
                           {isCardEditing && (
                             <>
                               <Button
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 onClick={handleCancelCard}
                                 className="h-8 text-xs px-4"
                                 disabled={isSavingCardEdits}
                               >
                                 Cancel
                               </Button>
                            <Button
                                 type="button"
                                  size="sm"
                                 onClick={handleSaveCardEdits}
                                 disabled={isSavingCardEdits}
                                 className="h-8 text-xs px-4 bg-[#E4F222] hover:bg-[#F5FF78] text-black"
                              >
                                   {isSavingCardEdits ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                       Saving...
                                  </>
                                ) : (
                                     "Save"
                                )}
                              </Button>
                             </>
                          )}

                          {!isCardEditing && (url?.length > 0 && orgName?.length > 0 && !profile?.organisationDescription) && (
                            <Button
                              type="submit"
                              size="sm"
                              disabled={isPending || isSavingCardEdits}
                              className={cn(
                                "h-9 px-4 bg-[#E4F222] hover:bg-[#F5FF78] text-black",
                                shouldPulse && "animate-pulse-edge",
                              )}
                            >
                              {isPending ? (
                                <div className="flex items-center">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  <span>Generating...</span>
                                </div>
                              ) : (
                                "Extract Context from Website"
                              )}
                            </Button>
                          )}

                          {!isCardEditing && !showManualContext && url?.length > 0 && orgName?.length > 0 && !profile?.organisationDescription && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={handleAddManualContext}
                              className="h-9 px-4 flex items-center gap-2"
                              disabled={isPending || isSavingCardEdits}
                            >
                              <PlusCircle className="h-4 w-4" />
                              Add Context Manually
                            </Button>
                          )}
                        </div>
                       </form>
                     </Form>
                   )}
                </CardContent>
              </Card>

              {(profile?.organisationDescription || showManualContext) && (
                <div ref={contextContainerRef}>
                  <ContextContainer
                    initialContext={profile?.organisationDescription || ""}
                    userId={user?.id}
                    onContextUpdated={handleContextUpdated}
                    startInEditMode={showManualContext && !profile?.organisationDescription}
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </NavSidebar>
  )
}

export default function ContextSetupPage() {
  return <ContextSetupInnerPage />
}
