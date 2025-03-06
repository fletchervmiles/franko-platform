/**
 * External Chat Progress Component
 * 
 * This client component displays the progress of an external chat session:
 * 1. Fetches progress data from the API using React Query
 * 2. Shows a progress bar based on objectives from chat_progress
 * 3. Updates automatically as the conversation progresses
 * 4. Refreshes data every second to keep progress current
 * 
 * This component provides visual feedback to users about their progress
 * through the conversation, helping them understand how far along they are
 * and when they're approaching completion.
 */

"use client"

import { useQuery } from '@tanstack/react-query'
import { ProgressBar, type Step } from "./progress-bar"
import type { ObjectiveProgress } from "@/db/schema/chat-instances-schema"
import { useState, useCallback, useMemo } from "react"
import React from "react"

interface ExternalChatProgressProps {
  chatResponseId: string  // ID of the chat response to track
  messageCount: number    // Number of messages in the conversation (triggers refetches)
}

/**
 * Fetches the current progress from the API
 * Returns the chat_progress field parsed as ObjectiveProgress
 */
async function fetchProgress(chatResponseId: string): Promise<{
  status: string
  completionStatus: string
  chatProgress: ObjectiveProgress | null
} | null> {
  const response = await fetch(`/api/external-chat/progress?chatResponseId=${chatResponseId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch progress')
  }
  const data = await response.json()
  
  // Parse chat_progress if it exists
  if (data.chatProgress) {
    try {
      // If chatProgress is a string, parse it as JSON
      // If it's already an object, use it directly
      if (typeof data.chatProgress === 'string') {
        data.chatProgress = JSON.parse(data.chatProgress)
      }
      // Otherwise, assume it's already a parsed object
    } catch (e) {
      console.error('Error parsing chat progress:', e)
      data.chatProgress = null
    }
  } else {
    data.chatProgress = null
  }
  
  return data
}

export const ExternalChatProgress = React.memo(function ExternalChatProgress({ 
  chatResponseId, 
  messageCount 
}: ExternalChatProgressProps) {
  // Track if we're currently fetching progress
  const [isUpdating, setIsUpdating] = useState(false);

  // Memoize query function to prevent recreation on each render
  const queryFn = useCallback(async () => {
    setIsUpdating(true);
    try {
      return await fetchProgress(chatResponseId);
    } finally {
      // Add a small delay before removing the updating state for better UX
      setTimeout(() => setIsUpdating(false), 300);
    }
  }, [chatResponseId]);

  // Fetch progress data with React Query
  const { data: progress, isLoading } = useQuery({
    queryKey: ['external-chat-progress', chatResponseId, messageCount],
    queryFn,
    // Only refetch when the query is stale
    staleTime: 5000, // 5 seconds
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
    // Don't retry on error
    retry: false,
    // Use previous data while loading new data
    placeholderData: (prev) => prev
  });

  // Don't render anything if we've never had progress data
  if (!progress) {
    return null;
  }

  // Memoize the steps calculation to avoid recalculations on every render
  const steps = useMemo(() => {
    // If we have detailed objective progress, use it to create steps
    if (progress.chatProgress?.objectives) {
      const objectives = progress.chatProgress.objectives;
      return Object.entries(objectives)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([id, obj]) => ({
          label: "", // Empty label since we're not displaying it
          status: obj.status === "done" ? "completed" 
                : obj.status === "current" ? "in-review"
                : "pending"
        })) as Step[];
    } else {
      // Fallback to simple two-step progress bar if no detailed progress is available
      return [
        {
          label: 'Interview in Progress',
          status: progress.status === 'in_progress' ? 'in-review' : 'completed'
        },
        {
          label: 'Interview Complete',
          status: progress.completionStatus === 'completed' ? 'completed' : 'pending'
        }
      ] as Step[];
    }
  }, [progress]);

  // Render the progress bar
  return (
    <ProgressBar
      steps={steps}
      className="max-w-none"
      isUpdating={isUpdating || isLoading}
    />
  );
});