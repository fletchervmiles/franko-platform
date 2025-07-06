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
import { ResponsesDownload } from "@/components/responses-download"
import type { ResponseFilters, ResponsesFiltersProps } from "@/types/responses"
import type { DateRange } from "react-day-picker"

// Add download props to the interface
interface ResponsesFiltersExtendedProps extends ResponsesFiltersProps {
  onDownload?: (format: 'csv' | 'llm') => void
  isDownloading?: boolean
  totalCount?: number
}

export function ResponsesFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  agentTypes,
  modalNames,
  onDownload,
  isDownloading,
  totalCount,
}: ResponsesFiltersExtendedProps) {
  const [dateRangeOpen, setDateRangeOpen] = useState(false)

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

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    // Allow same-date selection for single day ranges
    const newFilters = {
      ...filters,
      startDate: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
      endDate: range?.to ? format(range.to, "yyyy-MM-dd") : range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
    }
    onFiltersChange(newFilters)
    
    // Don't auto-close the picker - let users manually close it after selecting their desired range
    // This prevents the picker from closing on the first click and allows proper range selection
  }, [filters, onFiltersChange])

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== undefined)

  // Parse dates for calendar component
  const dateRange: DateRange | undefined = {
    from: filters.startDate ? new Date(filters.startDate) : undefined,
    to: filters.endDate ? new Date(filters.endDate) : undefined,
  }

  // Format date range display text
  const getDateRangeText = () => {
    if (dateRange?.from) {
      if (dateRange.to) {
        return `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
      }
      return format(dateRange.from, "MMM d, yyyy")
    }
    return "Select date range"
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Agent Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="agent-type">Agent Type</Label>
          <Select
            value={filters.agentType || "all"}
            onValueChange={handleAgentTypeChange}
          >
            <SelectTrigger 
              id="agent-type"
              className={cn(
                filters.agentType && filters.agentType !== "all" && "border-[#E4F222] bg-[#F5FF78]/20"
              )}
            >
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
          <Select
            value={filters.modalName || "all"}
            onValueChange={(value) => handleModalNameChange(value === "all" ? "" : value)}
          >
            <SelectTrigger 
              id="modal-name"
              className={cn(
                filters.modalName && "border-[#E4F222] bg-[#F5FF78]/20"
              )}
            >
              <SelectValue placeholder="All modals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modals</SelectItem>
              {modalNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange?.from && "text-muted-foreground",
                  (dateRange?.from || dateRange?.to) && "border-[#E4F222] bg-[#F5FF78]/20"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {getDateRangeText()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
                disabled={(date) => date > new Date()}
                initialFocus
                modifiers={dateRange?.from ? {
                  range_start: dateRange.from,
                  ...(dateRange.to && { range_end: dateRange.to }),
                  range_middle: (date) => {
                    if (!dateRange?.from || !dateRange?.to) return false
                    return date > dateRange.from && date < dateRange.to
                  }
                } : undefined}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Download Button */}
        {onDownload && (
          <div className="space-y-2">
            <Label className="invisible">Download</Label> {/* Invisible label for alignment */}
            <ResponsesDownload
              filters={filters}
              totalCount={totalCount || 0}
              onDownload={onDownload}
              isDownloading={isDownloading || false}
            />
          </div>
        )}
      </div>

      {/* Active Filters Display & Clear Button */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            {filters.agentType && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-[#F5FF78] text-gray-800 rounded-md text-sm border border-[#E4F222]">
                <span>Agent: {agentTypes.find(a => a.id === filters.agentType)?.name}</span>
                <button
                  onClick={() => handleAgentTypeChange("all")}
                  className="ml-1 hover:bg-[#E4F222] rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.modalName && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-[#F5FF78] text-gray-800 rounded-md text-sm border border-[#E4F222]">
                <span>Modal: {filters.modalName}</span>
                <button
                  onClick={() => handleModalNameChange("")}
                  className="ml-1 hover:bg-[#E4F222] rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {(filters.startDate || filters.endDate) && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-[#F5FF78] text-gray-800 rounded-md text-sm border border-[#E4F222]">
                <span>
                  {filters.startDate && filters.endDate
                    ? `${format(new Date(filters.startDate), "MMM d")} - ${format(new Date(filters.endDate), "MMM d")}`
                    : filters.startDate
                    ? `From: ${format(new Date(filters.startDate), "MMM d")}`
                    : `To: ${format(new Date(filters.endDate!), "MMM d")}`
                  }
                </span>
                <button
                  onClick={() => handleDateRangeChange(undefined)}
                  className="ml-1 hover:bg-[#E4F222] rounded-full p-0.5"
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