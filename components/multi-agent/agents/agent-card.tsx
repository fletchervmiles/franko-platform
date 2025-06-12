"use client"

import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Agent } from "@/lib/agents-data"

type AgentCardProps = {
  agent: Agent
  isEnabled: boolean
  onToggle: (id: string) => void
}

export function AgentCard({ agent, isEnabled, onToggle }: AgentCardProps) {
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
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full mr-3",
            isEnabled ? "text-blue-600" : "text-gray-400",
          )}
        >
          <agent.Icon className="h-5 w-5" />
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
          className="data-[state=checked]:bg-blue-600 scale-75"
          aria-label={`Toggle ${agent.name} agent`}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 pl-2.5">{agent.description}</p>
    </Card>
  )
}
