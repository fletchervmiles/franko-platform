"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-white shadow-sm max-w-md">
        <div className="rounded-full bg-red-50 p-3">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-lg font-medium text-gray-900">
            Unable to Load Interview
          </h2>
          <p className="text-sm text-gray-500">
            We encountered an issue while loading your interview session. This could be because the link has expired or is no longer valid.
          </p>
          <button
            onClick={reset}
            className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}
