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
import dynamic from "next/dynamic"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PersonaManager } from "@/components/persona-manager/persona-manager"
import { PersonaProvider, usePersonas } from "@/contexts/persona-context"
import { Progress } from "@/components/ui/progress"
import { useSetupChecklist } from "@/contexts/setup-checklist-context";

// Dynamically import BrandingContext only on the client side
const BrandingContext = dynamic(
  () => import("@/components/branding-context").then(mod => mod.BrandingContext),
  {
    ssr: false,
    loading: () => (
      <Card className="rounded-[6px] border bg-[#FAFAFA] shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }
)

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

// Query functions
const fetchProfile = async (userId: string) => {
  const profile = await getProfileByUserId(userId)
  return profile
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
  const { profile, isLoading: isLoadingProfile, setHighlightWorkspaceNavItem, isCompanyComplete, setIsCompanyComplete, isBrandingComplete, setIsBrandingComplete, isPersonasComplete, setIsPersonasComplete } = useProfile()
  const { personas, isLoadingPersonas, refetchPersonas } = usePersonas()
  const [activeTab, setActiveTab] = useState("organization")
  const [loadingProgress, setLoadingProgress] = useState(0)
  const personasTabTriggered = useRef(false);
  const { progress: setupProgress, refetchStatus: refetchSetupStatus } = useSetupChecklist();

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
      
      // Optimistically update profile cache so UI reflects new description immediately
      if (data && data.description) {
        console.log('Setting description in cache:', data.description.substring(0, 50) + '...');
        queryClient.setQueryData(queryKeys.profile(user?.id), (old: any) => {
          if (!old) return old;
          return {
            ...old,
            organisationDescription: data.description,
            organisationDescriptionCompleted: true,
          };
        });
        
        // Also update local state for immediate UI update
        setDescription(data.description);
        setShowManualContext(true); // Force the context container to be visible
      } else {
        console.warn('Context generation succeeded but no description returned');
      }
      
      setSubmittedValues({
        url: profile?.organisationUrl || form.getValues("url"),
        orgName: profile?.organisationName || form.getValues("orgName")
      })
      setIsCardEditing(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(user?.id), refetchType: 'active' })
      refetchPersonas()
      toast({
        title: "Success!",
        description: "Your context has been generated successfully.",
      })

      // Force a revalidation of server components and fresh data fetches
      router.refresh();

      setLoadingProgress(0)
      refetchSetupStatus();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update context. Please try again.",
      })
      setLoadingProgress(0)
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
      refetchSetupStatus();
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

    if (!isLoadingPersonas) {
      const personasDone = personas.length > 0;
      setIsPersonasComplete(personasDone);
    }
  }, [profile, form, personas, isLoadingPersonas, setIsCompanyComplete, setIsBrandingComplete, setIsPersonasComplete])

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

  useEffect(() => {
    // Check if the personas tab is active and the step isn't complete yet
    if (activeTab === 'personas' && !setupProgress.personasReviewed && !personasTabTriggered.current) {
      personasTabTriggered.current = true; // Mark as triggered for this session/load
      
      const markPersonaStepViewed = async () => {
        try {
          const response = await fetch('/api/onboarding/viewed-step', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ step: 'step3PersonasReviewed' }),
          });

          if (response.ok) {
            console.log('Successfully marked personas step as viewed.');
            refetchSetupStatus(); // Refetch status to update UI
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to mark personas step as viewed:', errorData.error || response.statusText);
            // Optionally reset the trigger ref if you want it to retry on next tab switch
            // personasTabTriggered.current = false; 
          }
        } catch (error) {
          console.error('Error calling viewed-step API for personas:', error);
          // Optionally reset the trigger ref
          // personasTabTriggered.current = false; 
        }
      };

      markPersonaStepViewed();
    }
    // Reset trigger if navigating away from the tab and it wasn't completed
    else if (activeTab !== 'personas' && !setupProgress.personasReviewed) {
        personasTabTriggered.current = false;
    }

  }, [activeTab, setupProgress, refetchSetupStatus]);

  const onSubmit = async (data: ContextSetupValues) => {
    if (!user?.id) return
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
      return {
        ...old,
        organisationDescription: updatedContext,
        organisationDescriptionCompleted: true,
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
    refetchSetupStatus();
  }

  const renderStatusDot = (isComplete: boolean) => (
    <span className={cn(
      "ml-2 h-2 w-2 rounded-full",
      isComplete ? "bg-green-500" : "bg-yellow-500"
    )}></span>
  );

  return (
    <NavSidebar>
      <div className="w-full p-4 md:p-8 lg:p-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            Context
          </h1>
        </div>

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
             <TabsTrigger
               value="branding"
               className="group relative rounded-none border-b-2 border-transparent px-4 h-12 data-[state=active]:border-black data-[state=active]:shadow-none transition-colors duration-200 ease-in-out"
             >
                <span className="relative z-10 p-2 rounded-lg group-hover:bg-gray-100 flex items-center">
                  Branding
                  {!isLoadingProfile && renderStatusDot(isBrandingComplete)}
                </span>
             </TabsTrigger>
             <TabsTrigger
               value="personas"
               className="group relative rounded-none border-b-2 border-transparent px-4 h-12 data-[state=active]:border-black data-[state=active]:shadow-none transition-colors duration-200 ease-in-out"
             >
               <span className="relative z-10 p-2 rounded-lg group-hover:bg-gray-100 flex items-center">
                 Personas
                 {!isLoadingPersonas && renderStatusDot(isPersonasComplete)}
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
                          <Tag className="h-4 w-4 text-blue-500" /> Company Details
                        </h2>
                        <p className="text-sm text-gray-500">Add your business details. This information builds the foundation for your AI Agents.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isCardEditing && profile?.organisationDescription && (
                           <Button
                              type="button"
                              size="sm"
                              onClick={() => onSubmit(form.getValues())}
                              disabled={isPending || isSavingCardEdits}
                              className="h-8 text-xs px-4 flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                            >
                              {isPending ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>Regenerating...</span>
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-3 w-3" />
                                  Regenerate Context
                                </>
                              )}
                          </Button>
                        )}
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
                           Fetching pages → extracting information → creating a structured document → generating your personas.
                           <br />
                           This usually takes under a minute.
                         </p>
                       </div>
                       <div className="w-full max-w-md px-4 pt-2">
                          <Progress
                             value={loadingProgress}
                             className="h-3 bg-blue-100 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-indigo-600"
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
                                  <Link className="h-4 w-4 text-blue-500" /> Website URL
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
                                  <Building className="h-4 w-4 text-blue-500" /> Company or Product Name
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
                                 className="h-8 text-xs px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
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
                                "h-9 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white",
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

          <TabsContent value="branding">
             {!isLoadingProfile && profile && user?.id ? (
                <BrandingContext
                  userId={user.id}
                  initialLogoUrl={profile.logoUrl}
                  initialButtonColor={profile.buttonColor}
                  initialTitleColor={profile.titleColor}
                />
              ) : (
                <LoadingPlaceholder />
              )}
          </TabsContent>

          <TabsContent value="personas">
            <PersonaManager />
          </TabsContent>
        </Tabs>
      </div>
    </NavSidebar>
  )
}

export default function ContextSetupPage() {
  return (
    <PersonaProvider>
      <ContextSetupInnerPage />
    </PersonaProvider>
  );
}
