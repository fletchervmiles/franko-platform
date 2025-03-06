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

interface Response {
  name: string
  email: string
  completionRate: number
  completionDate: string
  summary: string
  transcript: string
  customerWords: number
}

interface ResponseCardListProps {
  responses: Response[]
}

export function ResponseCardList({ responses }: ResponseCardListProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Interview Responses</h3>
      <div className="rounded-[6px] border bg-white shadow-sm overflow-hidden">
        {responses.map((response, index) => (
          <Suspense 
            key={index}
            fallback={
              <div className="p-6 border-b animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            }
          >
            <ResponseCard 
              key={index} 
              {...response} 
              isLast={index === responses.length - 1} 
            />
          </Suspense>
        ))}
      </div>
    </div>
  )
}