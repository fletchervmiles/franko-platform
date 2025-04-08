"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Globe, Building, InfoIcon, Edit, Check, PlusCircle, RefreshCw, Link, Tag } from "lucide-react"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useProfile } from "@/components/contexts/profile-context"
import { BrandingContext } from "@/components/branding-context"

const contextSetupSchema = z.object({
  url: z.string()
    .min(1, { message: "URL is required" })
    .refine(val => {
      // Basic domain format check (requires at least one dot and valid characters)
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
      // Remove http(s):// and trailing slashes if present for the check
      const domain = val.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
      return domainRegex.test(domain);
    }, { message: "Please enter a valid website address (e.g., company.com)" })
    .transform(val => {
      // If URL doesn't start with http/https, prepend https://
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

// Function to save individual field
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

export default function ContextSetupPage() {
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
  const { setHighlightWorkspaceNavItem } = useProfile()

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

  // Query for profile data
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      // Explicitly check if user.id exists before calling fetchProfile
      if (!user?.id) {
        // Should ideally not happen due to 'enabled' flag, but good practice
        return null // Or throw an error
      }
      return fetchProfile(user.id)
    },
    enabled: !!user?.id,
  })

  // Mutation for submitting context (full process)
  const { mutate, isPending } = useMutation({
    mutationFn: submitContext,
    onSuccess: (data) => {
      // Update form values
      form.setValue("url", data.organisationUrl)
      form.setValue("orgName", data.organisationName)
      setDescription(data.description)
      
      // Update submitted values
      setSubmittedValues({
        url: data.organisationUrl,
        orgName: data.organisationName
      })
      
      // Reset card editing state to return to view mode
      setIsCardEditing(false)
      
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      
      // Highlight workspace nav item if context was just completed (Step 8)
      if (!profile?.organisationDescriptionCompleted && data.description) {
        setHighlightWorkspaceNavItem(true)
      }
      
      toast({
        title: "Success!",
        description: "Your context has been generated successfully.",
      })
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update context. Please try again.",
      })
    }
  })

  // Mutation for saving individual fields (now used for saving card edits)
  const { mutate: saveCardEditsMutation, isPending: isSavingCardEdits } = useMutation({
    mutationFn: saveField,
    onSuccess: (data) => {
      // Update form values if they're returned
      if (data.organisationUrl !== undefined) {
        form.setValue("url", data.organisationUrl)
      }
      if (data.organisationName !== undefined) {
        form.setValue("orgName", data.organisationName)
      }
      
      // Update submitted values
      setSubmittedValues({
        url: data.organisationUrl ?? (submittedValues?.url ?? ""),
        orgName: data.organisationName ?? (submittedValues?.orgName ?? "")
      })
      
      // Exit edit mode
      setIsCardEditing(false)
      
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      
      toast({
        title: "Success!",
        description: "Fields updated successfully.",
      })
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update fields. Please try again.",
      })
    }
  })

  // Effect to update form when profile data changes
  useEffect(() => {
    if (profile) {
      form.setValue("url", profile.organisationUrl || "")
      form.setValue("orgName", profile.organisationName || "")
      setDescription(profile.organisationDescription || "")
      
      // Set initial submitted values when profile loads
        setSubmittedValues({
        url: profile.organisationUrl || "",
        orgName: profile.organisationName || ""
        })
      
      // Auto-enable card edit mode only if BOTH URL and Name are missing
      if (!profile.organisationUrl && !profile.organisationName) {
        setIsCardEditing(true)
      } else {
        // Otherwise, stay in view mode unless explicitly edited
        // Keep existing editing state if user triggered it
        // setIsCardEditing(false) // Removed this to preserve user-initiated edits
      }
    }
  }, [profile, form])

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  // Update pulse effect based on field values and description status
  useEffect(() => {
    setShouldPulse((url?.length || 0) > 0 && (orgName?.length || 0) > 0 && !profile?.organisationDescription)
  }, [url, orgName, profile])

  const onSubmit = async (data: ContextSetupValues) => {
    if (!user?.id) return
    
    // This function is now primarily for the initial context generation/regeneration
    mutate({
      userId: user.id,
      organisationUrl: data.url,
      organisationName: data.orgName,
    })
  }

  // New handler for saving card edits
  const handleSaveCardEdits = () => {
    if (!user?.id) return
    
    const urlValue = form.getValues("url")
    const nameValue = form.getValues("orgName")
    
    // Allow saving empty fields, so no validation here needed beyond what Zod provides if submitted
    // Trigger the mutation with both fields
    saveCardEditsMutation({
      userId: user.id,
      organisationUrl: urlValue,
      organisationName: nameValue
    })
  }

  const handleEditCard = () => {
    setIsCardEditing(true)
    // Preserve current values when starting edit
    setSubmittedValues({
        url: form.getValues("url"),
        orgName: form.getValues("orgName")
    })
  }

  const handleCancelCard = () => {
    setIsCardEditing(false)
    
    // Reset form values to last saved/loaded values
    if (submittedValues) {
      form.setValue("url", submittedValues.url)
      form.setValue("orgName", submittedValues.orgName)
    }
    // Clear errors if any were triggered during edit
    form.clearErrors()
  }

  const handleAddManualContext = () => {
    setShowManualContext(true)
    // Scroll to context container after a short delay to allow rendering
    setTimeout(() => {
      contextContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // We will handle setting edit mode via props in ContextContainer itself
    }, 100)
  }

  const handleContextUpdated = (updatedContext: string) => {
    setDescription(updatedContext)
    // Refetch profile data to update UI and potentially trigger nav highlight
    queryClient.invalidateQueries({ queryKey: ['profile', user?.id] }).then(() => {
      const freshProfile = queryClient.getQueryData(['profile', user?.id]) as typeof profile
      // Check if context just became completed (Step 8)
      if (!profile?.organisationDescriptionCompleted && freshProfile?.organisationDescriptionCompleted) {
        setHighlightWorkspaceNavItem(true)
      }
    })
  }

  return (
    <NavSidebar>
      <div className="w-full p-4 md:p-8 lg:p-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            Context Setup
            <span className={cn(
              "w-2 h-2 rounded-full",
              profile?.organisationDescription ? "bg-green-500" : "bg-yellow-500"
            )}></span>
          </h1>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[6px] border bg-[#FAFAFA] shadow-sm">
            <CardHeader className="pb-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base text-gray-700">Add your business details. This information will be used when generating your Conversation Plans and as overarching context during AI Agent conversations.</p>
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
                <div className="flex flex-col items-center space-y-4 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">Analyzing your organization</p>
                    <p className="text-sm text-gray-500">This may take up to a minute...</p>
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
                            <FormLabel className="text-base font-semibold flex items-center gap-2">
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
                            <FormLabel className="text-base font-semibold flex items-center gap-2">
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

          {!isLoadingProfile && profile && (
             <BrandingContext
                userId={user?.id}
                initialLogoUrl={profile.logoUrl}
                initialButtonColor={profile.buttonColor}
                initialTitleColor={profile.titleColor}
             />
          )}
        </div>
      </div>
    </NavSidebar>
  )
}
