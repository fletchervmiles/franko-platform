"use client"

import React, { createContext, useContext } from "react"
import type { AppSettings } from "@/lib/settings-context"

// Import the context type from the original settings context
interface SettingsContextType {
  settings: AppSettings
  updateInterfaceSettings: (settings: any) => void
  updateAgentSettings: (settings: any) => void
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

const EmbedSettingsContext = createContext<SettingsContextType | undefined>(undefined)

interface EmbedSettingsProviderProps {
  children: React.ReactNode
  brandSettings: AppSettings
}

export function EmbedSettingsProvider({ children, brandSettings }: EmbedSettingsProviderProps) {
  const contextValue: SettingsContextType = {
    settings: brandSettings,
    updateInterfaceSettings: () => {}, // No-op in embed context
    updateAgentSettings: () => {}, // No-op in embed context
    currentModal: null,
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
    <EmbedSettingsContext.Provider value={contextValue}>
      {children}
    </EmbedSettingsContext.Provider>
  )
}

// Export a useSettings hook that works in embed context
export function useEmbedSettings() {
  const context = useContext(EmbedSettingsContext)
  if (context === undefined) {
    throw new Error("useEmbedSettings must be used within an EmbedSettingsProvider")
  }
  return context
} 