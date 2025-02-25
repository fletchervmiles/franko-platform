import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-white shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <div className="space-y-2 text-center">
          <p className="text-lg font-medium text-gray-900">Processing Results</p>
          <p className="text-sm text-gray-500">Please wait while we finalize your session...</p>
        </div>
      </div>
    </div>
  )
} 