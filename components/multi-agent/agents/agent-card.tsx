"use client"

import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Agent } from "@/lib/agents-data"

type AgentCardProps = {
  agent: Agent
  isEnabled: boolean
  onToggle: (id: string) => void
  processedDescription?: string
}

export function AgentCard({ 
  agent, 
  isEnabled, 
  onToggle, 
  processedDescription 
}: AgentCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onToggle(agent.id)} // This handles click on the card itself
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onToggle(agent.id)
        }
      }}
      className={cn(
        "p-3 md:p-4 transition-shadow duration-200 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border",
      )}
    >
      <div className="flex items-center">
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center mr-3",
          isEnabled ? "bg-[#F5FF78]" : "bg-[#F4F2F0]"
        )}>
          <agent.Icon className="h-3 w-3 text-[#1C1617]" />
        </div>
        <div className="flex-grow">
          <p className="font-semibold text-sm">{agent.name}</p>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={() => {
            // onCheckedChange is the correct handler for the switch's state change
            onToggle(agent.id)
          }}
          onClick={(e) => {
            // Stop propagation to prevent the Card's onClick from firing
            // when the Switch itself is clicked.
            e.stopPropagation()
          }}
          className="data-[state=checked]:bg-[#E4F222] scale-75"
          aria-label={`Toggle ${agent.name} agent`}
        />
      </div>
      <div className="mt-2 pl-2.5 space-y-1">
        <p className="text-xs text-[#0c0a09]">{processedDescription || agent.description}</p>
      </div>
    </Card>
  )
}
