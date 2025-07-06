"use client"

import { useState } from "react"
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ResponsesDownloadProps } from "@/types/responses"

export function ResponsesDownload({
  filters,
  totalCount,
  onDownload,
  isDownloading,
}: ResponsesDownloadProps) {
  const [downloadType, setDownloadType] = useState<'csv' | 'llm' | null>(null)

  const handleDownload = async (format: 'csv' | 'llm') => {
    setDownloadType(format)
    await onDownload(format)
    setDownloadType(null)
  }

  // Show different states based on download progress
  const isDownloadingCSV = isDownloading && downloadType === 'csv'
  const isDownloadingLLM = isDownloading && downloadType === 'llm'

  if (totalCount === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>No responses to download</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isDownloading}
          className="min-w-[120px]"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {downloadType === 'csv' ? 'Generating CSV...' : 'Generating LLM...'}
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download ({totalCount})
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => handleDownload('csv')}
          disabled={isDownloading}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          <div className="flex flex-col">
            <span className="font-medium">Download CSV</span>
            <span className="text-xs text-gray-500">
              Spreadsheet format with all fields
            </span>
          </div>
          {isDownloadingCSV && (
            <Loader2 className="h-4 w-4 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleDownload('llm')}
          disabled={isDownloading}
          className="cursor-pointer"
        >
          <FileText className="h-4 w-4 mr-2 text-blue-600" />
          <div className="flex flex-col">
            <span className="font-medium">Download LLM Ready</span>
            <span className="text-xs text-gray-500">
              Markdown format for AI analysis
            </span>
          </div>
          {isDownloadingLLM && (
            <Loader2 className="h-4 w-4 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 text-xs text-gray-500">
          {Object.keys(filters).filter(key => filters[key as keyof typeof filters]).length > 0 ? (
            <>
              <div className="font-medium mb-1">Filters applied:</div>
              <ul className="space-y-0.5">
                {filters.agentType && <li>• Agent type</li>}
                {filters.modalName && <li>• Modal name</li>}
                {filters.startDate && <li>• Start date</li>}
                {filters.endDate && <li>• End date</li>}
              </ul>
            </>
          ) : (
            'All responses included'
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 