"use client"

import dynamic from "next/dynamic"
import { useMobileSafeguards } from "@/hooks/use-mobile-safeguards"
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
  // Apply mobile zoom / overscroll safeguards inside the iframe context
  useMobileSafeguards();
  // Determine if we need the pre-chat form (standalone link + toggle on)
  const requirePreChatForm = displayMode === "standalone" && modal.askNameEmailOnDirectLink === true;

  // Show the chat modal
  return (
    <EmbeddedChatModal 
      agentIds={agentIds}
      requirePreChatForm={requirePreChatForm}
      isPlayground={true}
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
      modalId={modal.id}
      isEmbedMode={true}
      organizationName={organizationName}
      displayMode={displayMode}
    />
  )
} 