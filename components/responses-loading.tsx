"use client"

import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ResponsesPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-20" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary skeleton */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Response cards skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="rounded-[6px] border bg-white shadow-sm overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-6 border-b last:border-b-0 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ResponseCardSkeleton() {
  return (
    <div className="p-6 border-b animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E4F222] border-t-transparent"></div>
      <span className="ml-2 text-gray-600">{message}</span>
    </div>
  )
}

export function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
      <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-lg border">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#E4F222] border-t-transparent"></div>
        <span className="text-gray-700">{message}</span>
      </div>
    </div>
  )
} 