"use client"

import { useState, useCallback } from "react"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import type { ResponseFilters, ResponsesFiltersProps } from "@/types/responses"

export function ResponsesFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  agentTypes,
  modalNames,
}: ResponsesFiltersProps) {
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  // Handle individual filter changes
  const handleAgentTypeChange = useCallback((value: string) => {
    const newFilters = {
      ...filters,
      agentType: value === "all" ? undefined : value,
    }
    onFiltersChange(newFilters)
  }, [filters, onFiltersChange])

  const handleModalNameChange = useCallback((value: string) => {
    const newFilters = {
      ...filters,
      modalName: value || undefined,
    }
    onFiltersChange(newFilters)
  }, [filters, onFiltersChange])

  const handleStartDateChange = useCallback((date: Date | undefined) => {
    const newFilters = {
      ...filters,
      startDate: date ? format(date, "yyyy-MM-dd") : undefined,
    }
    onFiltersChange(newFilters)
    setStartDateOpen(false)
  }, [filters, onFiltersChange])

  const handleEndDateChange = useCallback((date: Date | undefined) => {
    const newFilters = {
      ...filters,
      endDate: date ? format(date, "yyyy-MM-dd") : undefined,
    }
    onFiltersChange(newFilters)
    setEndDateOpen(false)
  }, [filters, onFiltersChange])

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== undefined)

  // Parse dates for calendar components
  const startDate = filters.startDate ? new Date(filters.startDate) : undefined
  const endDate = filters.endDate ? new Date(filters.endDate) : undefined

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Agent Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="agent-type">Agent Type</Label>
          <Select
            value={filters.agentType || "all"}
            onValueChange={handleAgentTypeChange}
          >
            <SelectTrigger id="agent-type">
              <SelectValue placeholder="All agent types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agent types</SelectItem>
              {agentTypes.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Modal Name Filter */}
        <div className="space-y-2">
          <Label htmlFor="modal-name">Modal Name</Label>
          <Input
            id="modal-name"
            placeholder="Search modal name..."
            value={filters.modalName || ""}
            onChange={(e) => handleModalNameChange(e.target.value)}
            className="w-full"
          />
          {modalNames.length > 0 && filters.modalName && (
            <div className="mt-1">
              <div className="text-xs text-gray-500 mb-1">Suggestions:</div>
              <div className="flex flex-wrap gap-1">
                {modalNames
                  .filter(name => 
                    name.toLowerCase().includes((filters.modalName || "").toLowerCase())
                  )
                  .slice(0, 3)
                  .map((name) => (
                    <button
                      key={name}
                      onClick={() => handleModalNameChange(name)}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
                    >
                      {name}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Start Date Filter */}
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "MMM d, yyyy") : "Select start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateChange}
                disabled={(date) =>
                  date > new Date() || (endDate && date > endDate)
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date Filter */}
        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "MMM d, yyyy") : "Select end date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateChange}
                disabled={(date) =>
                  date > new Date() || (startDate && date < startDate)
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filters Display & Clear Button */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            {filters.agentType && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                <span>Agent: {agentTypes.find(a => a.id === filters.agentType)?.name}</span>
                <button
                  onClick={() => handleAgentTypeChange("all")}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.modalName && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                <span>Modal: {filters.modalName}</span>
                <button
                  onClick={() => handleModalNameChange("")}
                  className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.startDate && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-sm">
                <span>From: {format(new Date(filters.startDate), "MMM d, yyyy")}</span>
                <button
                  onClick={() => handleStartDateChange(undefined)}
                  className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.endDate && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-sm">
                <span>To: {format(new Date(filters.endDate), "MMM d, yyyy")}</span>
                <button
                  onClick={() => handleEndDateChange(undefined)}
                  className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="ml-4 flex-shrink-0"
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )
} 