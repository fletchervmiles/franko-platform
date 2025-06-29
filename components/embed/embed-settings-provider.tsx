"use client"

import React, { createContext, useContext } from "react"
import type { AppSettings } from "@/lib/settings-context"
import { SettingsContext } from "@/lib/settings-context"
import type { SelectProfile } from "@/db/schema/profiles-schema"

// Import the context type from the original settings context
interface SettingsContextType {
  settings: AppSettings
  updateInterfaceSettings: (settings: any) => void
  updateAgentSettings: (settings: any) => void
  profile: SelectProfile | null
  isLoadingProfile: boolean
  currentModal: any
  modals: any[]
  createModal: (name: string) => Promise<any>
  loadModal: (modalId: string) => Promise<void>
  saveModal: () => Promise<void>
  deleteModal: (modalId: string) => Promise<void>
  loadUserModals: () => Promise<void>
  isLoading: boolean
  isSaving: boolean
  error: string | null
  clearError: () => void
}

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