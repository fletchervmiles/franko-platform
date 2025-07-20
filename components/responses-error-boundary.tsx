"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ResponsesErrorBoundaryProps {
  error: Error | null
  onRetry?: () => void
  onClearError?: () => void
}

export function ResponsesErrorBoundary({ 
  error, 
  onRetry, 
  onClearError 
}: ResponsesErrorBoundaryProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  // Auto-clear error after successful retry
  useEffect(() => {
    if (!error && isRetrying) {
      setIsRetrying(false)
    }
  }, [error, isRetrying])

  const handleRetry = async () => {
    if (onRetry) {
      setIsRetrying(true)
      try {
        await onRetry()
        onClearError?.()
      } catch (retryError) {
        console.error('Retry failed:', retryError)
        setIsRetrying(false)
      }
    }
  }

  if (!error) {
    return null
  }

  // Determine error type and provide appropriate messaging
  const getErrorInfo = (error: Error) => {
    const message = error.message.toLowerCase()
    
    if (message.includes('unauthorized') || message.includes('401')) {
      return {
        title: "Authentication Error",
        description: "Your session has expired. Please refresh the page to log in again.",
        showRetry: false,
      }
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return {
        title: "Connection Error",
        description: "Unable to connect to the server. Please check your internet connection and try again.",
        showRetry: true,
      }
    }
    
    if (message.includes('timeout')) {
      return {
        title: "Request Timeout",
        description: "The request took too long to complete. This might be due to a large dataset or server load.",
        showRetry: true,
      }
    }
    
    if (message.includes('500') || message.includes('internal server error')) {
      return {
        title: "Server Error",
        description: "An internal server error occurred. Our team has been notified. Please try again in a moment.",
        showRetry: true,
      }
    }
    
    return {
      title: "Unexpected Error",
      description: "An unexpected error occurred while loading responses. Please try again.",
      showRetry: true,
    }
  }

  const errorInfo = getErrorInfo(error)

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center text-red-600">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {errorInfo.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            {errorInfo.description}
          </AlertDescription>
        </Alert>
        
        {/* Technical details (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
              Technical Details
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {error.message}
              {error.stack && '\n\nStack trace:\n' + error.stack}
            </pre>
          </details>
        )}
        
        <div className="flex gap-2">
          {errorInfo.showRetry && onRetry && (
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              variant="outline"
              size="sm"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={() => window.location.reload()}
            variant="default"
            size="sm"
          >
            Refresh Page
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 