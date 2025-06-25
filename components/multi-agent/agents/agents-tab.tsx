"use client"
import { agentsData } from "@/lib/agents-data"
import { AgentCard } from "./agent-card"
import { WidgetPreview } from "./widget-preview"
import { useSettings } from "@/lib/settings-context"
import { useState, useEffect } from "react"
import { Check } from "lucide-react"

export function AgentsTab() {
  const { settings, updateAgentSettings, isSaving } = useSettings()
  const enabledAgents = settings.agents.enabledAgents

  const handleToggle = (id: string) => {
    const newEnabledAgents = {
      ...enabledAgents,
      [id]: !enabledAgents[id],
    }

    // Update settings - auto-save is handled by the context
    updateAgentSettings({ enabledAgents: newEnabledAgents })
  }

  const activeAgents = agentsData.filter((agent) => enabledAgents[agent.id])

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-[#FAFAFA] dark:bg-gray-800">
      {/* Full-width Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
        <h2 className="font-semibold mb-2 flex items-center text-gray-900">Select Your Interview Agents</h2>
        <p className="text-sm text-slate-600">
          The agents you enable will appear as options your users can select for giving feedback. Each agent will lead a
          1-2 minute conversation on the chosen topic.
        </p>
          </div>
          {isSaving && (
            <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Saving...
            </div>
          )}
        </div>
      </div>
      {/* Two-column content below the header */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column - Agent Controls */}
        <div>
          <div className="space-y-4">
            {agentsData.map((agent) => (
              <AgentCard key={agent.id} agent={agent} isEnabled={!!enabledAgents[agent.id]} onToggle={handleToggle} />
            ))}
          </div>
        </div>
        {/* Right Column - Live Widget Preview */}
        <div className="hidden md:block">
          <WidgetPreview
            activeAgents={activeAgents}
            displayName={settings.interface.displayName}
            instructions={settings.interface.instructions}
            themeOverride={settings.interface.theme}
            primaryBrandColor={settings.interface.primaryBrandColor}
            advancedColors={settings.interface.advancedColors}
            chatIconText={settings.interface.chatIconText}
            chatIconColor={settings.interface.chatIconColor}
            profilePictureUrl={settings.interface.profilePictureUrl}
            alignChatBubble={settings.interface.alignChatBubble}
          />
        </div>
      </div>
    </div>
  )
}
