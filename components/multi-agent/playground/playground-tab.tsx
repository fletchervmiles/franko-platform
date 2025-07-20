"use client"

import { useSettings } from "@/lib/settings-context"
import { WidgetPreview } from "../agents/widget-preview"
import { agentsData } from "@/lib/agents-data"

export function PlaygroundTab() {
  const { settings } = useSettings()

  const enabledAgents = settings.agents.enabledAgents
  const activeAgents = agentsData.filter((agent) => enabledAgents[agent.id])

  return (
    <div className="border border-gray-200 rounded-lg px-6 py-10 bg-[#FAFAFA] dark:bg-gray-800 diagonal-grid-light">
      <WidgetPreview
        activeAgents={activeAgents}
        displayName={settings.interface.displayName}
        instructions={settings.interface.instructions}
        themeOverride={settings.interface.theme}
        primaryBrandColor={settings.interface.primaryBrandColor}
        advancedColors={settings.interface.advancedColors}
        profilePictureUrl={settings.interface.profilePictureUrl}
        userMessageColor={settings.interface.userMessageColor}
        chatHeaderColor={settings.interface.chatHeaderColor}
        chatIconText={settings.interface.chatIconText}
        chatIconColor={settings.interface.chatIconColor}
        alignChatBubble={settings.interface.alignChatBubble}
        isPlayground={true}
      />
    </div>
  )
} 