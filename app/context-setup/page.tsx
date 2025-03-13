"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Globe, Building } from "lucide-react"
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

export default function ContextSetupPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [submittedValues, setSubmittedValues] = useState<ContextSetupValues | null>(null)
  const [shouldPulse, setShouldPulse] = useState(false)
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

  // Mutation for submitting context
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
      
      setIsEditing(false)
      
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

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (submittedValues) {
      form.setValue("url", submittedValues.url)
      form.setValue("orgName", submittedValues.orgName)
    }
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
                    <h2 className="text-2xl font-semibold">Organization Details</h2>
                    <p className="text-sm text-gray-500">Enter your organization's information to help the AI understand your context.</p>
                  </div>
                  {profile && !isEditing && (
                    <Button type="button" variant="outline" size="sm" onClick={handleEdit} className="h-9 text-xs px-4">
                      Edit
                    </Button>
                  )}
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
                              <Globe className="w-4 h-4 text-blue-600" />
                              Website
                            </FormLabel>
                            <p className="text-sm text-gray-500 mb-2">
                              We'll use your website content to ensure the AI conducts conversations in context.
                            </p>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="https://..."
                                  className="bg-[#FAFAFA] disabled:bg-[#FAFAFA] disabled:text-gray-900 transition-colors duration-200"
                                  {...field}
                                  disabled={profile && !isEditing}
                                />
                                {field.value.length === 0 && !profile && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 text-sm font-medium animate-pulse bg-indigo-50 px-3 py-1 rounded-full">
                                    ✨ Step 1. Submit your company URL!
                                  </div>
                                )}
                              </div>
                            </FormControl>
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
                              <Building className="w-4 h-4 text-blue-600" />
                              Company or Product Name
                            </FormLabel>
                            <p className="text-sm text-gray-500 mb-2">
                              We'll use your content to ensure the AI conducts conversations in context.
                            </p>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="Enter name..."
                                  className="bg-[#FAFAFA] disabled:bg-[#FAFAFA] disabled:text-gray-900 transition-colors duration-200"
                                  {...field}
                                  disabled={profile && !isEditing}
                                />
                                {field.value.length === 0 && !profile && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 text-sm font-medium animate-pulse bg-indigo-50 px-3 py-1 rounded-full">
                                    ✨ Step 2. Submit your company or product name
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      {isEditing && (
                        <Button type="button" variant="outline" size="sm" onClick={handleCancel} className="h-9 text-xs px-4">
                          Cancel
                        </Button>
                      )}
                      {(!profile || isEditing) && (
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isPending}
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
                            "Submit"
                          )}
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              )}

              {isLoadingProfile && (
                <div className="flex flex-col items-center space-y-2 py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                  <p className="text-sm text-gray-500">Setting up your context. Please wait…</p>
                </div>
              )}
            </CardContent>
          </Card>

          {profile?.organisationDescription && (
            <ContextContainer initialContext={profile.organisationDescription} />
          )}
        </div>
      </div>
    </NavSidebar>
  )
}
