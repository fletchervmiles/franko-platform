"use client"

import { useState, useCallback } from "react"
import type { Agent } from "@/lib/agents-data"

export type ModalView =
  | "agent-selection"
  | "loading"
  | "chatting"
  | "completion"

export type UIMessage = {
  id: string
  text: string
  sender: "agent" | "user"
  timestamp: number
}

interface SharedModalCoreConfig {
  /**
   * Optional callback when the host wants to intercept agent selection.
   * Returning `true` indicates the host has handled navigation and the core
   * should **not** switch to chatting view automatically.
   */
  onAgentSelect?: (agent: Agent) => void
}

/**
 * Shared chat-modal controller hook.
 *
 * Only the minimal state for phase-1 is extracted. More logic (API calls,
 * progress-bar handling, etc.) will migrate here incrementally.
 */
export function useSharedModalCore({ onAgentSelect }: SharedModalCoreConfig = {}) {
  // --- UI STATE -----------------------------------------------------------
  const [view, setView] = useState<ModalView>("agent-selection")
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [inputValue, setInputValue] = useState("")

  // Placeholder IDs – will be populated once we migrate API calls
  const [chatInstanceId, setChatInstanceId] = useState<string | null>(null)
  const [chatResponseId, setChatResponseId] = useState<string | null>(null)

  // --- HANDLERS -----------------------------------------------------------
  const handleAgentSelect = useCallback(
    (agent: Agent) => {
      onAgentSelect?.(agent)
      setSelectedAgent(agent)
      // For now, switch straight to chatting view (no loading screen yet)
      setView("chatting")
    },
    [onAgentSelect]
  )

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim()) return
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        text: inputValue,
        sender: "user",
        timestamp: Date.now(),
      },
    ])
    setInputValue("")
  }, [inputValue])

  const handleReturnToSelection = useCallback(() => {
    setView("agent-selection")
    setSelectedAgent(null)
    setMessages([])
    setChatInstanceId(null)
    setChatResponseId(null)
  }, [])

  const handleConversationComplete = useCallback(() => {
    setView("completion")
  }, [])

  const handleAnimationComplete = useCallback(() => {
    handleReturnToSelection()
  }, [handleReturnToSelection])

  return {
    // state
    view,
    selectedAgent,
    messages,
    inputValue,
    chatInstanceId,
    chatResponseId,
    // setters
    setInputValue: (val: string) => setInputValue(val),
    setMessages: (updater: (prev: UIMessage[]) => UIMessage[]) => setMessages(updater),
    // ui actions
    handleAgentSelect,
    handleSendMessage,
    handleReturnToSelection,
    handleConversationComplete,
    handleAnimationComplete,
    setView: (v: ModalView) => setView(v),
  }
} 