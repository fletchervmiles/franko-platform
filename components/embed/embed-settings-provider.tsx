"use client"

import React, { createContext, useContext } from "react"
import type { AppSettings, SettingsContextType, Modal } from "@/lib/settings-context"
import { SettingsContext } from "@/lib/settings-context"
import type { SelectProfile } from "@/db/schema/profiles-schema"

interface EmbedSettingsProviderProps {
  children: React.ReactNode
  brandSettings: AppSettings
  modal: {
    id: string
    name: string
    embedSlug: string
    userId: string
  }
  profile?: SelectProfile | null
}

export function EmbedSettingsProvider({ children, brandSettings, modal, profile }: EmbedSettingsProviderProps) {
  // Create a full Modal object from the minimal modal prop
  const fullModal: Modal | null = modal ? {
    id: modal.id,
    name: modal.name,
    embedSlug: modal.embedSlug,
    userId: modal.userId,
    brandSettings,
    askNameEmailOnDirectLink: false, // Default value for embed context
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } : null

  const contextValue: SettingsContextType = {
    settings: brandSettings,
    updateInterfaceSettings: () => {}, // No-op in embed context
    updateAgentSettings: () => {}, // No-op in embed context
    profile: profile || null,
    isLoadingProfile: false,
    currentModal: fullModal,
    modals: [],
    createModal: async () => {
      throw new Error("createModal not available in embed context")
    },
    loadModal: async () => {},
    saveModal: async () => {},
    updateModal: async (updates: Partial<Pick<any, 'askNameEmailOnDirectLink'>>) => {}, // No-op in embed context
    deleteModal: async () => {},
    loadUserModals: async () => {},
    isLoading: false,
    isSaving: false,
    error: null,
    clearError: () => {},
  }

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  )
}

// Keep the old function for backward compatibility, but it's no longer needed
export function useEmbedSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useEmbedSettings must be used within an EmbedSettingsProvider")
  }
  return context
} 