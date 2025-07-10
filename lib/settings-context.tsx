"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/queryKeys"
import type { SelectProfile } from "@/db/schema/profiles-schema"

export interface InterfaceSettings {
  displayName: string
  instructions: string
  theme: "light" | "dark"
  primaryBrandColor: string
  advancedColors: boolean
  chatIconText: string
  chatIconColor: string
  userMessageColor: string
  alignChatBubble: "left" | "right" | "custom"
  profilePictureUrl: string | null
  chatHeaderColor: string | null
}

export interface AgentSettings {
  enabledAgents: Record<string, boolean>
}

export interface AppSettings {
  interface: InterfaceSettings
  agents: AgentSettings
}

export interface Modal {
  id: string
  name: string
  embedSlug: string
  brandSettings: AppSettings
  askNameEmailOnDirectLink?: boolean
  responseEmailNotifications?: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SettingsContextType {
  // Settings
  settings: AppSettings
  updateInterfaceSettings: (settings: Partial<InterfaceSettings>) => void
  updateAgentSettings: (settings: Partial<AgentSettings>) => void
  
  // Profile data
  profile: SelectProfile | null
  isLoadingProfile: boolean
  
  // Modal management
  currentModal: Modal | null
  modals: Modal[]
  createModal: (name: string) => Promise<Modal>
  loadModal: (modalId: string) => Promise<void>
  saveModal: () => Promise<void>
  updateModal: (updates: Partial<Pick<Modal, 'askNameEmailOnDirectLink' | 'responseEmailNotifications'>>) => Promise<void>
  deleteModal: (modalId: string) => Promise<void>
  loadUserModals: () => Promise<void>
  
  // State management
  isLoading: boolean
  isSaving: boolean
  error: string | null
  clearError: () => void
}

const defaultSettings: AppSettings = {
  interface: {
    displayName: "We'd love your feedback",
    instructions: "Select a topic below. Each chat is short and sharp, ≈1-3 minutes.",
    theme: "light",
    primaryBrandColor: "",
    advancedColors: false,
    chatIconText: "Feedback",
    chatIconColor: "",
    userMessageColor: "",
    chatHeaderColor: null,
    alignChatBubble: "custom",
    profilePictureUrl: null,
  },
  agents: {
    enabledAgents: {
      AGENT01: true,
      AGENT02: true,
      AGENT03: true,
      AGENT04: true,
    },
  },
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

// Export the context for use in embed scenarios
export { SettingsContext }

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [currentModal, setCurrentModal] = useState<Modal | null>(null)
  const [modals, setModals] = useState<Modal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastSavedSettings = useRef<AppSettings | null>(null)

  // Fetch user profile data
  const {
    data: profile,
    isLoading: isLoadingProfile,
  } = useQuery<SelectProfile | null>({
    queryKey: queryKeys.profile(user?.id),
    enabled: isLoaded && !!user?.id,
    queryFn: async () => {
      const res = await fetch("/api/user/profile", {
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errorData.error || `Failed to fetch profile: ${res.status}`);
      }

      const data = (await res.json()) as Record<string, any>;
      return "userId" in data ? (data as SelectProfile) : null;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleApiError = useCallback((error: any, operation: string) => {
    console.error(`Failed to ${operation}:`, error)
    const message = error.response?.data?.error || error.message || `Failed to ${operation}`
    setError(message)
  }, [])

  // Load user's modals
  const loadUserModals = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/modals')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setModals(Array.isArray(data) ? data : [])
    } catch (error) {
      handleApiError(error, 'load modals')
    } finally {
      setIsLoading(false)
    }
  }, [user, handleApiError])

  // Create new modal
  const createModal = useCallback(async (name: string): Promise<Modal> => {
    if (!user) throw new Error('User not authenticated')
    
    setIsSaving(true)
    setError(null)
    
    try {
      const response = await fetch('/api/modals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          brandSettings: settings,
          reuseExistingPlans: true
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const newModal = data.modal
      
      setModals(prev => [...prev, newModal])
      setCurrentModal(newModal)
      setSettings(newModal.brandSettings)
      lastSavedSettings.current = newModal.brandSettings
      
      return newModal
    } catch (error) {
      handleApiError(error, 'create modal')
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [user, settings, handleApiError])

  // Load specific modal
  const loadModal = useCallback(async (modalId: string) => {
    if (!user) return
    
    // If empty modalId, clear current modal
    if (!modalId) {
      setCurrentModal(null)
      setSettings(defaultSettings)
      lastSavedSettings.current = null
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/modals/${modalId}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const modal = data.modal
      
      setCurrentModal(modal)
      setSettings(modal.brandSettings)
      lastSavedSettings.current = modal.brandSettings
    } catch (error) {
      handleApiError(error, 'load modal')
    } finally {
      setIsLoading(false)
    }
  }, [user, handleApiError])

  // Save current modal
  const saveModal = useCallback(async () => {
    if (!user || !currentModal) return
    
    setIsSaving(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/modals/${currentModal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandSettings: settings,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const updatedModal = data.modal
      
      setCurrentModal(updatedModal)
      setModals(prev => prev.map(m => m.id === updatedModal.id ? updatedModal : m))
    } catch (error) {
      handleApiError(error, 'save modal')
    } finally {
      setIsSaving(false)
    }
  }, [user, currentModal, settings, handleApiError])

  // Delete modal
  const deleteModal = useCallback(async (modalId: string) => {
    if (!user) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/modals/${modalId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      setModals(prev => prev.filter(m => m.id !== modalId))
      if (currentModal?.id === modalId) {
        setCurrentModal(null)
        setSettings(defaultSettings)
      }
    } catch (error) {
      handleApiError(error, 'delete modal')
    } finally {
      setIsLoading(false)
    }
  }, [user, currentModal, handleApiError])

  // Auto-save when settings change
  useEffect(() => {
    if (currentModal && user && isLoaded) {
      // Check if settings have actually changed
      const settingsChanged = !lastSavedSettings.current || 
        JSON.stringify(settings) !== JSON.stringify(lastSavedSettings.current)
      
      if (settingsChanged) {
        const timeoutId = setTimeout(async () => {
          if (!user || !currentModal) return
          
          setIsSaving(true)
          setError(null)
          
          try {
            const response = await fetch(`/api/modals/${currentModal.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                brandSettings: settings,
              }),
            })
            
            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
            }
            
            const data = await response.json()
            const updatedModal = data.modal
            
            setCurrentModal(updatedModal)
            setModals(prev => prev.map(m => m.id === updatedModal.id ? updatedModal : m))
            lastSavedSettings.current = settings
          } catch (error) {
            handleApiError(error, 'save modal')
          } finally {
            setIsSaving(false)
          }
        }, 2000) // Increased debounce to 2 seconds
        
        return () => clearTimeout(timeoutId)
      }
    }
  }, [settings, currentModal, user, isLoaded, handleApiError])

  // Update lastSavedSettings when modal is loaded
  useEffect(() => {
    if (currentModal) {
      lastSavedSettings.current = settings
    }
  }, [currentModal])

  // Load user modals when user is loaded
  useEffect(() => {
    if (user && isLoaded) {
      loadUserModals()
    }
  }, [user, isLoaded, loadUserModals])

  const updateInterfaceSettings = useCallback((newSettings: Partial<InterfaceSettings>) => {
    setSettings((prev) => ({
      ...prev,
      interface: { ...prev.interface, ...newSettings },
    }))
  }, [])

  const updateAgentSettings = useCallback((newSettings: Partial<AgentSettings>) => {
    setSettings((prev) => ({
      ...prev,
      agents: { ...prev.agents, ...newSettings },
    }))
  }, [])

  const updateModal = useCallback(async (updates: Partial<Pick<Modal, 'askNameEmailOnDirectLink' | 'responseEmailNotifications'>>) => {
    if (!user || !currentModal) return
    
    setIsSaving(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/modals/${currentModal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const updatedModal = data.modal
      
      setCurrentModal(updatedModal)
      setModals(prev => prev.map(m => m.id === updatedModal.id ? updatedModal : m))
    } catch (error) {
      handleApiError(error, 'update modal')
    } finally {
      setIsSaving(false)
    }
  }, [user, currentModal, handleApiError])

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateInterfaceSettings,
        updateAgentSettings,
        profile: profile ?? null,
        isLoadingProfile,
        currentModal,
        modals,
        createModal,
        loadModal,
        saveModal,
        deleteModal,
        loadUserModals,
        updateModal,
        isLoading,
        isSaving,
        error,
        clearError,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}