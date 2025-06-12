"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

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

interface SettingsContextType {
  settings: AppSettings
  updateInterfaceSettings: (settings: Partial<InterfaceSettings>) => void
  updateAgentSettings: (settings: Partial<AgentSettings>) => void
  saveSettings: () => void
  loadSettings: () => void
}

const defaultSettings: AppSettings = {
  interface: {
    displayName: "We'd love your feedback",
    instructions: "Select a topic below. Each chat is short and sharp, ≈1-3 minutes.",
    theme: "light",
    primaryBrandColor: "#3B82F6",
    advancedColors: false,
    chatIconText: "Feedback",
    chatIconColor: "#3B82F6",
    userMessageColor: "#3B82F6",
    chatHeaderColor: "#3B82F6",
    alignChatBubble: "right",
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

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)

  useEffect(() => {
    loadSettings()
  }, [])

  const updateInterfaceSettings = (newSettings: Partial<InterfaceSettings>) => {
    setSettings((prev) => ({
      ...prev,
      interface: { ...prev.interface, ...newSettings },
    }))
  }

  const updateAgentSettings = (newSettings: Partial<AgentSettings>) => {
    setSettings((prev) => ({
      ...prev,
      agents: { ...prev.agents, ...newSettings },
    }))
  }

  const saveSettings = () => {
    try {
      localStorage.setItem("franko-chat-settings", JSON.stringify(settings))
      console.log("Settings saved successfully")
    } catch (error) {
      console.error("Failed to save settings:", error)
    }
  }

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem("franko-chat-settings")
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        const mergedInterfaceSettings = {
          ...defaultSettings.interface,
          ...(parsedSettings.interface || {}),
        }
        const mergedAgentSettings = {
          ...defaultSettings.agents,
          ...(parsedSettings.agents || {}),
        }
        setSettings({
          interface: mergedInterfaceSettings,
          agents: mergedAgentSettings,
        })
      } else {
        setSettings(defaultSettings)
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
      setSettings(defaultSettings)
    }
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateInterfaceSettings,
        updateAgentSettings,
        saveSettings,
        loadSettings,
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