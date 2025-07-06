"use client"

import { Suspense, lazy } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Dynamically import the heavy ResponseCard component to reduce initial bundle size
const ResponseCard = dynamic(
  () => import("./response-card").then((mod) => ({ default: mod.ResponseCard })),
  {
    loading: () => (
      <div className="p-6 border-b animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    ),
    ssr: false,
  }
)

// Updated interface to match the new aggregated response structure
interface Response {
  name: string
  email: string
  completionRate: number
  completionDate: string
  summary: string
  transcript: string
  customerWords: number
  agentName: string // Added agent name
  modalName?: string | null // Added modal name
  modalEmbedSlug?: string | null
}

interface ResponseCardListProps {
  responses: Response[]
}

export function ResponseCardList({ responses }: ResponseCardListProps) {
  if (!responses || responses.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No responses found</h3>
        <p className="text-gray-600">There are no responses matching your current filters.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Interview Responses ({responses.length})</h3>
      <div className="rounded-[6px] border bg-white shadow-sm overflow-hidden">
        {responses.map((response, index) => (
          <Suspense 
            key={`${response.name}-${response.completionDate}-${index}`} // More unique key
            fallback={
              <div className="p-6 border-b animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            }
          >
            <ResponseCard 
              key={`${response.name}-${response.completionDate}-${index}`}
              {...response} 
              isLast={index === responses.length - 1}
              // Pass the new fields for global view
              agentName={response.agentName}
              modalName={response.modalName}
            />
          </Suspense>
        ))}
      </div>
    </div>
  )
}