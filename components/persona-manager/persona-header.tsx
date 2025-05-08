"use client"

import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PersonaHeaderProps {
  onHelpClick: () => void
}

export function PersonaHeader({ onHelpClick }: PersonaHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-gray-800">Personas</h1>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-gray-500 bg-gray-100">
                System-Seeded
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">
                These personas were automatically generated based on your company's public information. Edit them to
                change the badge to "Customized".
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Button variant="ghost" size="icon" onClick={onHelpClick} aria-label="Help">
        <HelpCircle className="h-5 w-5" />
      </Button>
    </div>
  )
}
