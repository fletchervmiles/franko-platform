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
  const [isEditingUrl, setIsEditingUrl] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isSavingUrl, setIsSavingUrl] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)
  const [submittedValues, setSubmittedValues] = useState<ContextSetupValues | null>(null)
  const [shouldPulse, setShouldPulse] = useState(false)
  const [showManualContext, setShowManualContext] = useState(false)
  const { toast } = useToast()
  const [description, setDescription] = useState<string>("")

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
    queryFn: () => fetchProfile(user?.id!),
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
      
      // Reset all editing states to return to view mode
      setIsCardEditing(false)
      setIsEditingUrl(false)
      setIsEditingName(false)
      
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      
      toast({
        title: "Success!",
        description: "Your context has been updated successfully.",
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

  // Mutation for saving individual fields
  const { mutate: saveFieldMutation, isPending: isSavingField } = useMutation({
    mutationFn: saveField,
    onSuccess: (data) => {
      // Update form values if they're returned
      if (data.organisationUrl) {
        form.setValue("url", data.organisationUrl)
      }
      if (data.organisationName) {
        form.setValue("orgName", data.organisationName)
      }
      
      // Update submitted values
      setSubmittedValues({
        url: data.organisationUrl || (submittedValues?.url || ""),
        orgName: data.organisationName || (submittedValues?.orgName || "")
      })
      
      // Reset edit states
      setIsEditingUrl(false)
      setIsEditingName(false)
      setIsSavingUrl(false)
      setIsSavingName(false)
      
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      
      toast({
        title: "Success!",
        description: "Field updated successfully.",
      })
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update field. Please try again.",
      })
      setIsSavingUrl(false)
      setIsSavingName(false)
    }
  })

  // Effect to update form when profile data changes
  useEffect(() => {
    if (profile) {
      form.setValue("url", profile.organisationUrl || "")
      form.setValue("orgName", profile.organisationName || "")
      setDescription(profile.organisationDescription || "")
      
      if (profile.organisationUrl && profile.organisationName) {
        setSubmittedValues({
          url: profile.organisationUrl,
          orgName: profile.organisationName
        })
      }
      
      // Auto-enable card edit mode if description is incomplete
      // If description is complete, ensure we're in view mode
      if (!profile.organisationDescriptionCompleted) {
        setIsCardEditing(true)
        setIsEditingUrl(profile.organisationUrl ? false : true)
        setIsEditingName(profile.organisationName ? false : true)
      } else {
        setIsCardEditing(false)
        setIsEditingUrl(false)
        setIsEditingName(false)
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
    
    mutate({
      userId: user.id,
      organisationUrl: data.url,
      organisationName: data.orgName,
    })
  }

  const handleSaveUrl = () => {
    if (!user?.id) return
    
    const urlValue = form.getValues("url")
    if (!urlValue) {
      form.setError("url", { message: "URL is required" })
      return
    }
    
    setIsSavingUrl(true)
    saveFieldMutation({
      userId: user.id,
      organisationUrl: urlValue
    })
  }

  const handleSaveName = () => {
    if (!user?.id) return
    
    const nameValue = form.getValues("orgName")
    if (!nameValue) {
      form.setError("orgName", { message: "Organisation name is required" })
      return
    }
    
    setIsSavingName(true)
    saveFieldMutation({
      userId: user.id,
      organisationName: nameValue
    })
  }

  const handleEditCard = () => {
    setIsCardEditing(true)
  }

  const handleCancelCard = () => {
    setIsCardEditing(false)
    setIsEditingUrl(false)
    setIsEditingName(false)
    
    // Reset form values to last submitted values
    if (submittedValues) {
      form.setValue("url", submittedValues.url)
      form.setValue("orgName", submittedValues.orgName)
    }
  }

  const handleEditUrl = () => {
    setIsEditingUrl(true)
  }

  const handleEditName = () => {
    setIsEditingName(true)
  }

  const handleCancelUrl = () => {
    setIsEditingUrl(false)
    if (submittedValues?.url) {
      form.setValue("url", submittedValues.url)
    }
  }

  const handleCancelName = () => {
    setIsEditingName(false)
    if (submittedValues?.orgName) {
      form.setValue("orgName", submittedValues.orgName)
    }
  }

  const handleAddManualContext = () => {
    setShowManualContext(true)
  }

  const handleContextUpdated = (updatedContext: string) => {
    setDescription(updatedContext)
    setIsCardEditing(false)
    // Refetch profile data to update UI
    queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
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
                    <p className="text-base text-gray-700">Tell us about your business so your AI can understand who you are and deliver personalized conversations.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isCardEditing && profile && (
                      <Button onClick={handleEditCard} variant="outline" size="sm" className="h-8 text-xs px-4">
                        Edit
                      </Button>
                    )}
                    {isCardEditing && (
                      <Button onClick={handleCancelCard} variant="outline" size="sm" className="h-8 text-xs px-4">
                        Cancel
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
                                    <p>We scan publicly available information from your website to help your AI understand your products, services, and terminology.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <p className="text-sm text-gray-500 mb-2">
                              We'll analyze your website content to build context.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <FormControl className="w-full">
                                <div className="relative w-full">
                                  <Input
                                    placeholder="https://..."
                                    className="bg-[#FAFAFA] disabled:bg-[#FAFAFA] disabled:text-gray-800 disabled:font-medium transition-colors duration-200"
                                    {...field}
                                    disabled={!isEditingUrl}
                                  />
                                </div>
                              </FormControl>
                              {isCardEditing && (
                                <div className="flex justify-end sm:justify-start sm:flex-shrink-0">
                                  {isEditingUrl ? (
                                    <div className="flex items-center gap-1">
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm"
                                        onClick={handleCancelUrl}
                                        className="h-8 px-2 text-xs"
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        type="button" 
                                        size="sm"
                                        onClick={handleSaveUrl}
                                        disabled={isSavingUrl || !field.value}
                                        className="h-8 px-2 text-xs"
                                      >
                                        {isSavingUrl ? (
                                          <>
                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                            Save
                                          </>
                                        ) : (
                                          <>
                                            <Check className="mr-1 h-3 w-3" />
                                            Save
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  ) : (
                                    field.value && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleEditUrl}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Edit className="h-3 w-3 text-gray-500" />
                                      </Button>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                            {field.value.length === 0 && !profile?.organisationUrl && (
                              <p className="text-xs text-indigo-600 mt-1 font-medium">
                                ✨ Please enter your company URL
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
                                    <p>Enter your official company or brand name here, so your AI can correctly represent your business in interactions.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <p className="text-sm text-gray-500 mb-2">
                              Used to reference your business accurately in conversations.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <FormControl className="w-full">
                                <div className="relative w-full">
                                  <Input
                                    placeholder="Enter name..."
                                    className="bg-[#FAFAFA] disabled:bg-[#FAFAFA] disabled:text-gray-800 disabled:font-medium transition-colors duration-200"
                                    {...field}
                                    disabled={!isEditingName}
                                  />
                                </div>
                              </FormControl>
                              {isCardEditing && (
                                <div className="flex justify-end sm:justify-start sm:flex-shrink-0">
                                  {isEditingName ? (
                                    <div className="flex items-center gap-1">
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm"
                                        onClick={handleCancelName}
                                        className="h-8 px-2 text-xs"
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        type="button" 
                                        size="sm"
                                        onClick={handleSaveName}
                                        disabled={isSavingName || !field.value}
                                        className="h-8 px-2 text-xs"
                                      >
                                        {isSavingName ? (
                                          <>
                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                            Save
                                          </>
                                        ) : (
                                          <>
                                            <Check className="mr-1 h-3 w-3" />
                                            Save
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  ) : (
                                    field.value && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleEditName}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Edit className="h-3 w-3 text-gray-500" />
                                      </Button>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                            {field.value.length === 0 && !profile?.organisationName && (
                              <p className="text-xs text-indigo-600 mt-1 font-medium">
                                ✨ Please enter your company or product name
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex flex-wrap justify-end gap-3">
                      {/* Show resubmit button when in edit mode and both URL and company name exist */}
                      {isCardEditing && profile?.organisationUrl && profile?.organisationName && profile?.organisationDescription && (
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isPending || isEditingUrl || isEditingName}
                          className="h-9 px-4 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                        >
                          {isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              <span>Regenerating...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4" />
                              Regenerate AI Context
                            </>
                          )}
                        </Button>
                      )}
                      
                      {/* Show extract context button if URL and name entered but no description yet */}
                      {(url?.length > 0 && orgName?.length > 0 && !profile?.organisationDescription) && (
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isPending || isEditingUrl || isEditingName}
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
                            "Extract context from website"
                          )}
                        </Button>
                      )}
                      
                      {/* Show Add Context Manually button if we have URL and name but no description yet */}
                      {!showManualContext && url?.length > 0 && orgName?.length > 0 && !profile?.organisationDescription && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleAddManualContext}
                          className="h-9 px-4 flex items-center gap-2"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Add context manually
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          {/* Show context container if there's content or showing manual context entry */}
          {(profile?.organisationDescription || showManualContext) && (
            <ContextContainer 
              initialContext={profile?.organisationDescription || ""} 
              userId={user?.id}
              onContextUpdated={handleContextUpdated}
            />
          )}
        </div>
      </div>
    </NavSidebar>
  )
}
