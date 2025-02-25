"use client"

import { useQuery } from '@tanstack/react-query'
import { ProgressBar, type Step } from "./progress-bar"

interface ExternalChatProgressProps {
  chatResponseId: string
  messageCount: number
}

async function fetchProgress(chatResponseId: string): Promise<{
  status: string
  completionStatus: string
} | null> {
  const response = await fetch(`/api/external-chat/progress?chatResponseId=${chatResponseId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch progress')
  }
  return response.json()
}

export function ExternalChatProgress({ chatResponseId, messageCount }: ExternalChatProgressProps) {
  const { data: progress } = useQuery({
    queryKey: ['external-chat-progress', chatResponseId, messageCount],
    queryFn: () => fetchProgress(chatResponseId),
    refetchInterval: 1000
  })

  if (!progress) {
    return null
  }

  const steps: Step[] = [
    {
      label: 'Interview in Progress',
      status: progress.status === 'in_progress' ? 'in-review' : 'completed'
    },
    {
      label: 'Interview Complete',
      status: progress.completionStatus === 'completed' ? 'completed' : 'pending'
    }
  ]

  return (
    <ProgressBar
      steps={steps}
      className="max-w-none"
    />
  )
} 