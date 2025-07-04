"use client"

import React, { createContext, useContext } from "react"
import type { AppSettings, SettingsContextType } from "@/lib/settings-context"
import { SettingsContext } from "@/lib/settings-context"
import type { SelectProfile } from "@/db/schema/profiles-schema"

interface EmbedSettingsProviderProps {
  children: React.ReactNode
  brandSettings: AppSettings
  modal: {
    id: string
    name: string
    embedSlug: string
  }
  profile?: SelectProfile | null
}

export function EmbedSettingsProvider({ children, brandSettings, modal, profile }: EmbedSettingsProviderProps) {
  const contextValue: SettingsContextType = {
    settings: brandSettings,
    updateInterfaceSettings: () => {}, // No-op in embed context
    updateAgentSettings: () => {}, // No-op in embed context
    profile: profile || null,
    isLoadingProfile: false,
    currentModal: modal || null,
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