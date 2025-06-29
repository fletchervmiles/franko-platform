"use client"

import { Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState, useEffect, useCallback, useMemo } from "react"
import React from "react"
import Link from "next/link"
import { CreateChatButton } from "./create-chat-button"
import Image from "next/image"
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
import { useToast } from "@/components/ui/use-toast"

interface Workspace {
  id: string
  guideName: string
  lastEdited: string
  responses: number
  customerWords: number
}

interface Modal {
  id: string
  name: string
  lastEdited: string
  embedSlug: string
  isActive: boolean
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-4 text-center">
      <div className="mb-6">
        <Image
          src="/assets/user_avatar.svg"
          alt="Franko logo"
          width={64}
          height={64}
        />
      </div>
      <h1 className="text-2xl font-semibold mb-3">Create Interview Agent</h1>
      <p className="text-sm text-gray-600 mb-6 max-w-md">
      Answer a few quick questions, or use a template, to create a custom plan for a new Interview Agent.
      </p>
      <CreateChatButton />
    </div>  
  )
}

export const WorkspaceList = React.memo(function WorkspaceList() {
  const [isMounted, setIsMounted] = useState(false)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [workspaceToDelete, setWorkspaceToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/chat-instances')
      
      if (!response.ok) {
        // Try to get more specific error message from the response
        let errorMessage = 'Failed to fetch workspaces. Please try again later.'
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          // If we can't parse the error, use the default message
        }
        
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      setWorkspaces(data)
    } catch (error) {
      console.error('Error fetching workspaces:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load workspaces. Please try again later.'
      setError(errorMessage)
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 100) // 100ms delay

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isMounted) {
      fetchWorkspaces()
    }
  }, [isMounted, fetchWorkspaces])

  const handleDeleteClick = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation
    e.stopPropagation() // Prevent event bubbling
    setWorkspaceToDelete(id)
    setShowDeleteDialog(true)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!workspaceToDelete) return

    try {
      const response = await fetch(`/api/chat-instances/${workspaceToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        // Try to get more specific error message from the response
        let errorMessage = 'Failed to delete workspace. Please try again later.'
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          // If we can't parse the error, use the default message
        }
        
        throw new Error(errorMessage)
      }

      // Remove the deleted workspace from the state
      setWorkspaces(workspaces.filter(workspace => workspace.id !== workspaceToDelete))
      
      toast({
        title: "Success",
        description: "Workspace deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting workspace:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete workspace. Please try again later.'
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
      setWorkspaceToDelete(null)
    }
  }, [workspaceToDelete, workspaces, toast])

  const handleRename = useCallback(async (id: string, e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation
    e.stopPropagation() // Prevent event bubbling
    
    // Find the workspace to rename
    const workspace = workspaces.find(w => w.id === id)
    if (!workspace) return
    
    // Prompt the user for a new title
    const newTitle = window.prompt("Enter a new title for this conversation:", workspace.guideName)
    
    // If the user cancels or enters an empty title, do nothing
    if (!newTitle || newTitle.trim() === '') {
      return
    }
    
    try {
      const response = await fetch(`/api/chat-instances/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      })
      
      if (!response.ok) {
        // Try to get more specific error message from the response
        let errorMessage = 'Failed to rename workspace. Please try again later.'
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          // If we can't parse the error, use the default message
        }
        
        throw new Error(errorMessage)
      }
      
      // Update the workspace in the state
      setWorkspaces(workspaces.map(w => 
        w.id === id ? { ...w, guideName: newTitle } : w
      ))
      
      toast({
        title: "Success",
        description: "Workspace renamed successfully",
      })
    } catch (error) {
      console.error('Error renaming workspace:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to rename workspace. Please try again later.'
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [workspaces, toast])

  if (!isMounted) {
    return null // or a loading placeholder
  }

  if (isLoading) {
    return (
      <div className="w-full p-4 md:p-8 lg:p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E4F222] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workspaces...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full p-4 md:p-8 lg:p-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchWorkspaces} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // If no workspaces, show empty state
  if (workspaces.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="w-full p-4 md:p-8 lg:p-12 space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black">Workspace</h1>
          <div className="flex items-center gap-2">
            <CreateChatButton />
          </div>
        </div>
      </div>

      <div className="rounded-[6px] border bg-white shadow-sm">
        {workspaces.map((workspace, index) => (
          <Link
            href={`/conversations/${encodeURIComponent(workspace.id)}`}
            key={workspace.id}
            className={`flex flex-col gap-4 p-4 hover:bg-muted/50 lg:grid lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-center ${
              index !== workspaces.length - 1 ? "border-b" : ""
            }`}
          >
            <span className="text-sm font-semibold text-foreground order-1">{workspace.guideName}</span>
            <div className="order-3">
              <span className="text-sm text-muted-foreground">Responses</span>
              <p className="text-sm font-light text-foreground">{workspace.responses.toLocaleString()}</p>
            </div>
            <div className="order-4">
              <span className="text-sm text-muted-foreground">Customer Words</span>
              <p className="text-sm font-light text-foreground">{workspace.customerWords.toLocaleString()}</p>
            </div>
            <div className="order-5">
              <span className="text-sm text-muted-foreground">Last Edited</span>
              <p className="text-sm font-light text-foreground">{workspace.lastEdited}</p>
            </div>
            <div className="flex items-center gap-3 order-6">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Rectangle%201-zNq3ZeSKpAcDWZtxAfVWG0VVquUKB2.svg"
                className="h-6 w-6 rounded-full"
                alt="User avatar"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                    <span className="sr-only">Open menu</span>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                    >
                      <path
                        d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={(e) => handleRename(workspace.id, e)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    <span>Rename</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleDeleteClick(workspace.id, e)} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Link>
        ))}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all of its responses.
            </AlertDialogDescription>
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
  )
});

export const ModalWorkspaceList = React.memo(function ModalWorkspaceList() {
  const [isMounted, setIsMounted] = useState(false)
  const [modals, setModals] = useState<Modal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchModals = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/modals')
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch modals. Please try again later.'
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          // If we can't parse the error, use the default message
        }
        
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      setModals(data)
    } catch (error) {
      console.error('Error fetching modals:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load modals. Please try again later.'
      setError(errorMessage)
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isMounted) {
      fetchModals()
    }
  }, [isMounted, fetchModals])

  if (!isMounted) {
    return <div className="animate-pulse">Loading modals...</div>
  }

  if (isLoading) {
    return <div>Loading modals...</div>
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchModals}>Retry</Button>
      </div>
    )
  }

  if (modals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-4 text-center">
        <div className="mb-6">
          <Image
            src="/assets/user_avatar.svg"
            alt="Franko logo"
            width={64}
            height={64}
          />
        </div>
        <h1 className="text-2xl font-semibold mb-3">No Modals Found</h1>
        <p className="text-sm text-gray-600 mb-6 max-w-md">
          You don't have any feedback modals yet. Complete the onboarding process to create your first modal.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Feedback Modals</h2>
      </div>
      
      <div className="grid gap-4">
        {modals.map((modal) => (
          <Link
            key={modal.id}
            href={`/workspace?modalId=${modal.id}`}
            className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium text-lg mb-1">{modal.name}</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Embed: {modal.embedSlug}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Last edited: {new Date(modal.lastEdited).toLocaleDateString()}</span>
                  <span className={`px-2 py-1 rounded-full ${modal.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {modal.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
})