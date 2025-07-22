"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UiUsageData } from '@/lib/utils/usage-formatter'

interface UsageContextType {
  usageData: UiUsageData | null
  isUsageExceeded: boolean
  isLoading: boolean
  error: string | null
  refreshUsage: () => void
}

const UsageContext = createContext<UsageContextType | undefined>(undefined)

interface UsageProviderProps {
  children: ReactNode
  modalOwnerId?: string | null // The userId who owns the current modal
}

export function UsageProvider({ children, modalOwnerId }: UsageProviderProps) {
  const [usageData, setUsageData] = useState<UiUsageData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate if usage is exceeded based on responses quota only
  const isUsageExceeded = usageData 
    ? usageData.responses.used >= usageData.responses.total
    : false

  const fetchUsageData = async () => {
    // Don't show loading states - this is background only
    if (!modalOwnerId) {
      setUsageData(null)
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // When modalOwnerId is provided, send it as a query parameter
      const url = new URL('/api/usage', window.location.origin)
      url.searchParams.set('modalOwnerId', modalOwnerId)

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        // Graceful degradation - assume usage is available
        console.warn('Failed to fetch usage data, assuming available')
        setUsageData({
          responses: { used: 0, total: 100, percentage: 0 },
          conversationPlans: { used: 0, total: 10, percentage: 0 },
          qaMessages: { used: 0, total: 100, percentage: 0 }
        })
        return
      }

      const data = await response.json()
      setUsageData(data.data)
    } catch (err) {
      // Graceful degradation - assume usage is available
      console.warn('Error fetching usage data, assuming available:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setUsageData({
        responses: { used: 0, total: 100, percentage: 0 },
        conversationPlans: { used: 0, total: 10, percentage: 0 },
        qaMessages: { used: 0, total: 100, percentage: 0 }
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch usage data when modalOwnerId changes
  useEffect(() => {
    fetchUsageData()
  }, [modalOwnerId])

  const refreshUsage = () => {
    fetchUsageData()
  }

  const contextValue: UsageContextType = {
    usageData,
    isUsageExceeded,
    isLoading,
    error,
    refreshUsage,
  }

  return (
    <UsageContext.Provider value={contextValue}>
      {children}
    </UsageContext.Provider>
  )
}

export function useUsage(): UsageContextType {
  const context = useContext(UsageContext)
  if (context === undefined) {
    throw new Error('useUsage must be used within a UsageProvider')
  }
  return context
} 