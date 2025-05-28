"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useFeedback } from "@/contexts/feedback-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const personaOptions = [
  { value: "all", label: "All Personas" },
  { value: "solo-developer", label: "Solo Developer" },
  { value: "startup-cto", label: "Startup CTO" },
  { value: "enterprise-engineer", label: "Enterprise Engineer" },
  { value: "coding-student", label: "Coding Student" },
  { value: "product-manager", label: "Product Manager" },
]

// Updated time periods with Max option
const timePeriods = ["Monthly", "Quarterly", "6 Months", "Max"]

export function PersonaSelector() {
  const {
    selectedSegments: selectedPersonas,
    setSelectedSegments: setSelectedPersonas,
    selectedTimePeriod,
    setSelectedTimePeriod,
    isLoading,
    segmentCounts: personaCounts,
  } = useFeedback()

  const [open, setOpen] = useState(false)

  const handleSelect = (value: string) => {
    setSelectedPersonas((current: string[]) => {
      let updated: string[]

      // Handle "All Segments" special case
      if (value === "all") {
        updated = current.includes("all") ? [] : ["all"]
      } else {
        // Remove "all" if it's selected and we're selecting something else
        const withoutAll = current.filter((item: string) => item !== "all")

        // Toggle the selected value
        updated = withoutAll.includes(value) ? withoutAll.filter((item: string) => item !== value) : [...withoutAll, value]
      }

      // If nothing is selected, default to "All Segments"
      if (updated.length === 0) {
        updated = ["all"]
      }

      return updated
    })
  }

  const removeSegment = (value: string) => {
    setSelectedPersonas((current: string[]) => {
      // Don't allow removing the last segment
      if (current.length === 1) {
        return ["all"]
      }

      const updated = current.filter((item: string) => item !== value)
      return updated
    })
  }

  const clearAll = () => {
    setSelectedPersonas(["all"])
  }

  // Calculate total count for all segments
  const totalCount = Object.values(personaCounts).reduce((sum, count) => sum + count, 0)

  // Get tooltip content for time period
  const getTimePeriodTooltip = (period: string) => {
    switch (period) {
      case "Monthly":
        return "Data from the past month"
      case "Quarterly":
        return "Data from the past 3 months"
      case "6 Months":
        return "Data from the past 6 months"
      case "Max":
        return "All historical data ever collected"
      default:
        return ""
    }
  }

  return (
    <Card className="border shadow-sm rounded-[6px] bg-white font-sans">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-800">Persona</CardTitle>
        <p className="text-sm text-gray-500">Filter results by user personas</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                  {selectedPersonas.includes("all") ? "All Personas" : `${selectedPersonas.length} selected`}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search personas..." />
                  <CommandList>
                    <CommandEmpty>No persona found.</CommandEmpty>
                    <CommandGroup>
                      {personaOptions.map((segment) => (
                        <CommandItem
                          key={segment.value}
                          value={segment.value}
                          onSelect={() => handleSelect(segment.value)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedPersonas.includes(segment.value) ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {segment.label}
                            </div>
                            {segment.value !== "all" && (
                              <span className="text-xs text-gray-500">{personaCounts[segment.value] || 0}</span>
                            )}
                            {segment.value === "all" && <span className="text-xs text-gray-500">{totalCount}</span>}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <div className="flex flex-wrap gap-2 mt-2">
              {selectedPersonas.map((value) => {
                const segment = personaOptions.find((s) => s.value === value)
                if (!segment) return null

                return (
                  <Badge key={value} variant="secondary" className="px-2 py-1 rounded-md">
                    {segment.label}
                    {value !== "all" && (
                      <span className="ml-1 text-xs text-gray-500">({personaCounts[value] || 0})</span>
                    )}
                    {value === "all" && <span className="ml-1 text-xs text-gray-500">({totalCount})</span>}
                    {selectedPersonas.length > 1 && (
                      <button
                        className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                        onClick={() => removeSegment(value)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {segment.label}</span>
                      </button>
                    )}
                  </Badge>
                )
              })}
              {selectedPersonas.length > 1 && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearAll}>
                  Clear all
                </Button>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100">
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Time Period:</span>
              </div>

              <div className="inline-block p-1.5 rounded-md bg-gray-100 overflow-x-auto max-w-md">
                <div className="flex justify-between min-w-fit">
                  {timePeriods.map((period) => (
                    <TooltipProvider key={period} delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "px-4 py-2 text-sm font-medium whitespace-nowrap text-center",
                              selectedTimePeriod === period
                                ? "bg-white text-gray-900 shadow-sm rounded-md"
                                : "bg-transparent text-gray-500 hover:text-gray-700",
                              "focus:outline-none focus:ring-0",
                              "transition-colors duration-200",
                              "flex-1 min-w-0 mx-1",
                              period === "Max" && "relative",
                            )}
                            onClick={() => setSelectedTimePeriod(period)}
                          >
                            {period}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-black text-white border-black text-xs">
                          {getTimePeriodTooltip(period)}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
