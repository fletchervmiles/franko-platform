import { useQuery } from '@tanstack/react-query';
import { ProgressBar, type Step } from "./progress-bar";
import type { ObjectiveProgress } from "@/db/schema/chat-instances-schema";
import { useEffect, useState } from 'react';
import { queryClient } from './utilities/query-provider';

interface ConversationProgressProps {
  conversationId: string;
  messageCount: number;
  isLoading?: boolean; // Add isLoading prop to know when AI is responding
}

async function fetchProgress(chatId: string): Promise<ObjectiveProgress | null> {
  const response = await fetch(`/api/progress?chatId=${chatId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch progress');
  }
  return response.json();
}

export function ConversationProgress({ 
  conversationId, 
  messageCount,
  isLoading = false
}: ConversationProgressProps) {
  // Track last update time to avoid excessive polling
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  // Track if we're currently fetching progress
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: progress, isFetching } = useQuery<ObjectiveProgress | null>({
    queryKey: ['objective-progress', conversationId],
    queryFn: async () => {
      setIsUpdating(true);
      try {
        return await fetchProgress(conversationId);
      } finally {
        // Add a small delay before removing the updating state for better UX
        setTimeout(() => setIsUpdating(false), 300);
      }
    },
    // Only refetch when the query is stale
    staleTime: 5000, // Reduced from Infinity to 5 seconds
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
    // Don't retry on error
    retry: false
  });

  // Refetch progress when message count changes
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['objective-progress', conversationId] });
    setLastUpdateTime(Date.now());
  }, [conversationId, messageCount]);

  // Poll for updates when AI is responding
  useEffect(() => {
    if (!isLoading) return;
    
    // Don't poll too frequently - wait at least 2 seconds between polls
    const shouldPoll = Date.now() - lastUpdateTime > 2000;
    
    if (shouldPoll) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['objective-progress', conversationId] });
        setLastUpdateTime(Date.now());
      }, 2000); // Poll every 2 seconds while loading
      
      return () => clearInterval(interval);
    }
  }, [conversationId, isLoading, lastUpdateTime]);

  if (!progress?.objectives) {
    return null;
  }

  const steps: Step[] = Object.entries(progress.objectives)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, obj]) => ({
      label: "", // Empty label since we're not displaying it anymore
      status: obj.status === "done" ? "completed" 
             : obj.status === "current" ? "in-review"
             : "pending"
    }));

  return <ProgressBar steps={steps} isUpdating={isUpdating || isFetching} />;
} 