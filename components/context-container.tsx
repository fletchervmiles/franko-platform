"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2, Check, ChevronDown, ChevronUp, InfoIcon, Bot, Database } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Markdown from "react-markdown"
import { useUser } from "@clerk/nextjs"
import { useToast } from "@/hooks/use-toast"

interface ContextContainerProps {
  initialContext: string
  userId?: string
  onContextUpdated?: (updatedContext: string) => void
}

export function ContextContainer({ initialContext, userId, onContextUpdated }: ContextContainerProps) {
  const { user } = useUser()
  const { toast } = useToast()
  const [context, setContext] = useState(initialContext)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [wordCount, setWordCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    setContext(initialContext)
    // Add a small delay to show loading state
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timeout)
  }, [initialContext])

  useEffect(() => {
    setWordCount(context.split(/\s+/).filter(Boolean).length)
  }, [context])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const currentUserId = userId || user?.id
      
      if (!currentUserId) {
        throw new Error("User ID not available")
      }
      
      const response = await fetch('/api/context', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          organisationDescription: context
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save context")
      }
      
      const data = await response.json()
      
      if (onContextUpdated) {
        onContextUpdated(context)
      }
      
      toast({
        title: "Success!",
        description: "Your knowledge base has been updated successfully.",
      })
      
      setIsEditing(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save your changes. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setContext(initialContext)
    setIsEditing(false)
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <Card className="rounded-[6px] border bg-[#FAFAFA] shadow-sm">
      <CardHeader className="pb-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" /> Your AI Knowledge Base
              </h2>
              {isLoading && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-5 w-5 text-gray-500 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" className="bg-black text-white border-black max-w-xs p-2 rounded">
                    <p>This information is automatically generated from your provided details and website, ensuring your AI provides accurate, consistent, and tailored conversations.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button onClick={handleEdit} variant="outline" size="sm" className="h-8 text-xs px-4">
                  Edit
                </Button>
              )}
              <Button onClick={toggleExpand} variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-500">Your customized set of insights that guides AI conversations.</p>
          <div className="pt-2 flex items-center space-x-2">
            <div className="bg-white p-2 rounded-lg border flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">
                {wordCount.toLocaleString()} words
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg border p-4"
            >
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="min-h-[300px] text-sm leading-relaxed border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
                    placeholder="Enter the context here..."
                  />
                  <div className="flex justify-end space-x-2">
                    <Button onClick={handleCancel} variant="outline" size="sm" className="h-8 text-xs px-4">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      size="sm"
                      className="h-8 text-xs px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-3 w-3" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[500px] overflow-y-auto pr-4 mb-4">
                        <div className="prose prose-sm max-w-none">
                          <Markdown>{context}</Markdown>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

