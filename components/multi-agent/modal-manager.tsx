"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useSettings } from "@/lib/settings-context"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Settings, Trash2, ExternalLink, Edit2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import SimpleTabs from "./simple-tabs"
import { formatDistanceToNow } from "date-fns"
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
import { Input } from "@/components/ui/input"

// Inline Name Editor Component
function InlineNameEditor({ 
  initialName, 
  onSave, 
  onCancel,
  className = ""
}: { 
  initialName: string
  onSave: (newName: string) => Promise<void>
  onCancel: () => void
  className?: string
}) {
  const [name, setName] = useState(initialName)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (name.trim() === '' || name.trim() === initialName) {
      onCancel()
      return
    }
    
    setIsSaving(true)
    try {
      await onSave(name.trim())
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <Input
      value={name}
      onChange={(e) => setName(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleSave}
      disabled={isSaving}
      className={`${className} ${isSaving ? 'opacity-50' : ''}`}
      autoFocus
      selectOnFocus
    />
  )
}

function CreateModalButton() {
  const { createModal } = useSettings()
  const [isCreating, setIsCreating] = useState(false)

  const generateDefaultName = () => {
    return "New Chat Modal"
  }

  const handleCreate = async () => {
    const defaultName = generateDefaultName()
    setIsCreating(true)
    try {
      await createModal(defaultName)
    } catch (error) {
      // Error is handled by the context
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Button onClick={handleCreate} disabled={isCreating}>
      {isCreating ? "Creating..." : "Create Chat Modal"}
    </Button>
  )
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
      <h1 className="text-2xl font-semibold mb-3">Create Chat Modal</h1>
      <p className="text-sm text-gray-600 mb-6 max-w-md">
        Create a multi-agent chat modal that can be embedded on your website. Visitors will choose from different conversation types.
      </p>
      <CreateModalButton />
    </div>  
  )
}

// Memoized header component with inline editing support
const ModalHeader = React.memo(function ModalHeader({ 
  title, 
  onRename, 
  onShowDeleteDialog 
}: { 
  title: string; 
  onRename: (newName: string) => Promise<void>; 
  onShowDeleteDialog: () => void 
}) {
  const [isEditing, setIsEditing] = useState(false)

  const handleStartEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async (newName: string) => {
    await onRename(newName)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  return (
    <div className="flex items-center justify-between">
      <div className="overflow-hidden mr-4 flex-1">
        {isEditing ? (
          <InlineNameEditor
            initialName={title}
            onSave={handleSave}
            onCancel={handleCancel}
            className="text-2xl font-semibold text-black h-10"
          />
        ) : (
          <h1 
            className="text-2xl font-semibold text-black overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:text-gray-700 transition-colors"
            onClick={handleStartEdit}
            title="Click to rename"
          >
            {title}
          </h1>
        )}
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
            <DropdownMenuItem onClick={handleStartEdit}>
              <Edit2 className="mr-2 h-4 w-4" />
              <span>Rename</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShowDeleteDialog} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

export default function ModalManager() {
  const {
    currentModal,
    modals,
    loadModal,
    deleteModal,
    isLoading,
    isSaving,
    error,
    clearError,
    loadUserModals,
  } = useSettings()

  const [isMounted, setIsMounted] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [modalToDelete, setModalToDelete] = useState<string | null>(null)
  const [editingModalId, setEditingModalId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isMounted) {
      loadUserModals()
    }
  }, [isMounted, loadUserModals])

  const handleDeleteClick = useCallback((id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setModalToDelete(id)
    setShowDeleteDialog(true)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!modalToDelete) return

    try {
      await deleteModal(modalToDelete)
      toast({
        title: "Success",
        description: "Chat modal deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete chat modal",
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
      setModalToDelete(null)
    }
  }, [modalToDelete, deleteModal, toast])

  const handleStartRename = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingModalId(id)
  }, [])

  const handleRename = useCallback(async (id: string, newName: string) => {
    try {
      const response = await fetch(`/api/modals/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to rename chat modal')
      }
      
      // Reload modals to get updated data
      await loadUserModals()
      setEditingModalId(null)
      
      toast({
        title: "Success",
        description: "Chat modal renamed successfully",
      })
    } catch (error) {
      console.error('Error renaming modal:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to rename chat modal",
        variant: "destructive",
      })
      throw error // Re-throw so the inline editor can handle it
    }
  }, [toast, loadUserModals])

  const handleCancelRename = useCallback(() => {
    setEditingModalId(null)
  }, [])

  // Handle rename from header (inline editing)
  const handleHeaderRename = useCallback(async (newName: string) => {
    if (!currentModal) return
    
    try {
      const response = await fetch(`/api/modals/${currentModal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to rename chat modal')
      }
      
      const data = await response.json()
      const updatedModal = data.modal
      
      // Update current modal and modals list
      loadModal(updatedModal.id)
      await loadUserModals()
      
      toast({
        title: "Success",
        description: "Chat modal renamed successfully",
      })
    } catch (error) {
      console.error('Error renaming modal:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to rename chat modal",
        variant: "destructive",
      })
      throw error // Re-throw so the inline editor can handle it
    }
  }, [currentModal, toast, loadModal, loadUserModals])

  // Handle delete from header dropdown (when editing a modal)
  const handleHeaderDelete = useCallback(() => {
    if (!currentModal) return
    setModalToDelete(currentModal.id)
    setShowDeleteDialog(true)
  }, [currentModal])

  // If a modal is selected, show the tabs interface
  if (currentModal) {
    return (
      <div className="w-full p-4 md:p-8 lg:p-12 space-y-6">
        {/* Modal Header */}
        <ModalHeader 
          title={currentModal.name}
          onRename={handleHeaderRename}
          onShowDeleteDialog={handleHeaderDelete}
        />

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button variant="ghost" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs Interface */}
        <SimpleTabs />

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this chat modal and all of its configuration.
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
  }

  if (!isMounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className="w-full p-4 md:p-8 lg:p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat modals...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full p-4 md:p-8 lg:p-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={loadUserModals} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // If no modals, show empty state
  if (modals.length === 0) {
    return <EmptyState />
  }

  // Show modal list (matching workspace-list style exactly)
  return (
    <div className="w-full p-4 md:p-8 lg:p-12 space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black">Chat Modals</h1>
          <div className="flex items-center gap-2">
            <CreateModalButton />
          </div>
        </div>
      </div>

      <div className="rounded-[6px] border bg-white shadow-sm">
        {modals.map((modal, index) => (
          <div
            key={modal.id}
            className={`flex flex-col gap-4 p-4 hover:bg-muted/50 lg:grid lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-center cursor-pointer ${
              index !== modals.length - 1 ? "border-b" : ""
            }`}
            onClick={() => loadModal(modal.id)}
          >
            <div className="text-sm font-semibold text-foreground order-1">
              {editingModalId === modal.id ? (
                <InlineNameEditor
                  initialName={modal.name}
                  onSave={(newName) => handleRename(modal.id, newName)}
                  onCancel={handleCancelRename}
                  className="text-sm font-semibold"
                />
              ) : (
                <span 
                  className="cursor-pointer hover:text-gray-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingModalId(modal.id)
                  }}
                  title="Click to rename"
                >
                  {modal.name}
                </span>
              )}
            </div>
            <div className="order-3">
              <span className="text-sm text-muted-foreground">Responses</span>
              <p className="text-sm font-light text-foreground">0</p>
            </div>
            <div className="order-4">
              <span className="text-sm text-muted-foreground">Agents</span>
              <p className="text-sm font-light text-foreground">
                {modal.brandSettings?.agents?.enabledAgents 
                  ? Object.values(modal.brandSettings.agents.enabledAgents).filter(Boolean).length 
                  : 0}
              </p>
            </div>
            <div className="order-5">
              <span className="text-sm text-muted-foreground">Created</span>
              <p className="text-sm font-light text-foreground">
                {formatDistanceToNow(new Date(modal.createdAt), { addSuffix: true })}
              </p>
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
                  <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); loadModal(modal.id); }}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configure</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(`/embed/${modal.embedSlug}`, '_blank'); }}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    <span>Preview</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleStartRename(modal.id, e)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    <span>Rename</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleDeleteClick(modal.id, modal.name, e)} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chat modal and all of its configuration.
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
}