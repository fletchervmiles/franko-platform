"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { PreChatForm } from "@/components/embed/pre-chat-form"
import type { AppSettings } from "@/lib/settings-context"
import type { SelectModal } from "@/db/schema/modals-schema"

const EmbeddedChatModal = dynamic(() => import("@/components/embed/embedded-chat-modal"), { ssr: false })

interface EmbedPageClientProps {
  modal: SelectModal
  agentIds: string[]
  brandSettings: AppSettings
  organizationName: string
  displayMode: "modal" | "standalone"
}

export function EmbedPageClient({ 
  modal, 
  agentIds, 
  brandSettings, 
  organizationName, 
  displayMode 
}: EmbedPageClientProps) {
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Show form only for standalone display mode and if modal requires it
    if (displayMode === "standalone" && modal.askNameEmailOnDirectLink) {
      setShowForm(true)
    }
  }, [modal.askNameEmailOnDirectLink, displayMode])

  const handleFormSubmit = (data: { name: string; email: string }) => {
    setIsLoading(true)
    
    // Set window.FrankoUser with form data
    if (typeof window !== 'undefined') {
      (window as any).FrankoUser = {
        user_id: null, // No external user ID from form
        user_hash: null, // No hash verification
        user_metadata: {
          name: data.name,
          email: data.email,
          source: "direct_link_form"
        }
      }
    }
    
    // Hide form and show chat
    setShowForm(false)
    setIsLoading(false)
  }

  // If form should be shown and hasn't been submitted yet
  if (showForm) {
    return (
      <PreChatForm
        onSubmit={handleFormSubmit}
        displayName={brandSettings.interface.displayName}
        isLoading={isLoading}
      />
    )
  }

  // Show the chat modal
  return (
    <EmbeddedChatModal 
      agentIds={agentIds}
      displayName={brandSettings.interface.displayName}
      instructions={brandSettings.interface.instructions}
      themeOverride={brandSettings.interface.theme}
      primaryBrandColor={brandSettings.interface.primaryBrandColor}
      advancedColors={brandSettings.interface.advancedColors}
      profilePictureUrl={brandSettings.interface.profilePictureUrl}
      userMessageColor={brandSettings.interface.userMessageColor}
      chatHeaderColor={brandSettings.interface.chatHeaderColor}
      chatIconText={brandSettings.interface.chatIconText}
      chatIconColor={brandSettings.interface.chatIconColor}
      alignChatBubble={brandSettings.interface.alignChatBubble}
      isPlayground={true}
      modalId={modal.id}
      isEmbedMode={true}
      organizationName={organizationName}
      displayMode={displayMode}
    />
  )
} 