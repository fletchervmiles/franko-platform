"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ResponseCardList } from "@/components/response-card-list"
import { ResponsesFilters } from "@/components/responses-filters"
import { ResponsesPagination } from "@/components/responses-pagination"
import { ResponsesDownload } from "@/components/responses-download"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { 
  AggregatedResponsesApiResponse, 
  ResponseFilters, 
  TransformedResponse 
} from "@/types/responses"

interface ResponsesPageClientProps {
  initialData?: AggregatedResponsesApiResponse
  userId: string
  agentTypes: Array<{ id: string; name: string }>
}

export function ResponsesPageClient({ 
  initialData, 
  userId, 
  agentTypes 
}: ResponsesPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // State management
  const [data, setData] = useState<AggregatedResponsesApiResponse | null>(initialData || null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Parse current filters from URL
  const currentFilters = useMemo((): ResponseFilters => ({
    agentType: searchParams?.get('agentType') || undefined,
    modalName: searchParams?.get('modalName') || undefined,
    startDate: searchParams?.get('startDate') || undefined,
    endDate: searchParams?.get('endDate') || undefined,
  }), [searchParams])

  const currentPage = useMemo(() => {
    const page = searchParams?.get('page')
    return page ? parseInt(page) : 1
  }, [searchParams])

  // Fetch data function
  const fetchData = useCallback(async (filters: ResponseFilters, page: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      queryParams.set('page', page.toString())
      if (filters.agentType) queryParams.set('agentType', filters.agentType)
      if (filters.modalName) queryParams.set('modalName', filters.modalName)
      if (filters.startDate) queryParams.set('startDate', filters.startDate)
      if (filters.endDate) queryParams.set('endDate', filters.endDate)

      const response = await fetch(`/api/responses?${queryParams.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const newData: AggregatedResponsesApiResponse = await response.json()
      setData(newData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch responses'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Update URL with new parameters
  const updateUrl = useCallback((filters: ResponseFilters, page: number = 1) => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (filters.agentType) params.set('agentType', filters.agentType)
    if (filters.modalName) params.set('modalName', filters.modalName)
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)

    const queryString = params.toString()
    const newUrl = queryString ? `/responses?${queryString}` : '/responses'
    
    router.push(newUrl, { scroll: false })
  }, [router])

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: ResponseFilters) => {
    updateUrl(newFilters, 1) // Reset to page 1 when filters change
    fetchData(newFilters, 1)
  }, [updateUrl, fetchData])

  // Handle page changes
  const handlePageChange = useCallback((newPage: number) => {
    updateUrl(currentFilters, newPage)
    fetchData(currentFilters, newPage)
  }, [currentFilters, updateUrl, fetchData])

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    const emptyFilters: ResponseFilters = {}
    updateUrl(emptyFilters, 1)
    fetchData(emptyFilters, 1)
  }, [updateUrl, fetchData])

  // Handle downloads
  const handleDownload = useCallback(async (format: 'csv' | 'llm') => {
    setIsDownloading(true)
    
    try {
      const queryParams = new URLSearchParams()
      if (currentFilters.agentType) queryParams.set('agentType', currentFilters.agentType)
      if (currentFilters.modalName) queryParams.set('modalName', currentFilters.modalName)
      if (currentFilters.startDate) queryParams.set('startDate', currentFilters.startDate)
      if (currentFilters.endDate) queryParams.set('endDate', currentFilters.endDate)

      const response = await fetch(`/api/responses/download/${format}?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to download ${format.toUpperCase()} file`)
      }

      // Handle file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `responses_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'md'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: `${format.toUpperCase()} file downloaded successfully`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to download ${format.toUpperCase()}`
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }, [currentFilters, toast])

  // Get unique modal names for filter dropdown
  const modalNames = useMemo(() => {
    if (!data?.responses) return []
    const names = new Set(
      data.responses
        .map(r => r.modalName)
        .filter((name): name is string => name !== null && name !== undefined)
    )
    return Array.from(names).sort()
  }, [data?.responses])

  // Show error state
  if (error && !data) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    )
  }

  // Show loading state for initial load
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading responses...</span>
      </div>
    )
  }

  // Show empty state
  if (!data || data.responses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <h3 className="text-lg font-semibold mb-2">No responses found</h3>
          <p className="text-gray-600 mb-4">
            {Object.keys(currentFilters).length > 0 
              ? "No responses match your current filters. Try adjusting your search criteria."
              : "You haven't received any interview responses yet."
            }
          </p>
          {Object.keys(currentFilters).length > 0 && (
            <button
              onClick={handleClearFilters}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Clear all filters
            </button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsesFilters
            filters={currentFilters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            agentTypes={agentTypes}
            modalNames={modalNames}
          />
        </CardContent>
      </Card>

      {/* Summary and Download */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {data.responses.length} of {data.pagination.totalCount} responses
              {data.pagination.totalPages > 1 && (
                <span> (Page {data.pagination.currentPage} of {data.pagination.totalPages})</span>
              )}
            </div>
            <ResponsesDownload
              filters={currentFilters}
              totalCount={data.pagination.totalCount}
              onDownload={handleDownload}
              isDownloading={isDownloading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading overlay for subsequent loads */}
      {isLoading && (
        <div className="relative">
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </div>
      )}

      {/* Response Cards */}
      <ResponseCardList responses={data.responses} />

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <ResponsesPagination
          pagination={data.pagination}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
} 