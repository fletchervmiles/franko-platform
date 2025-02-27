import { useQuery } from '@tanstack/react-query';
import { ProgressBar, type Step } from "./progress-bar";
import type { ObjectiveProgress } from "@/db/schema/chat-instances-schema";
import { useEffect, useState, useRef } from 'react';
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
  // Track if we're currently fetching progress
  const [isUpdating, setIsUpdating] = useState(false);
  // Add a new state to track when we expect progress updates
  const [expectingUpdates, setExpectingUpdates] = useState(false);
  // Use refs to track polling state
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track previous loading state
  const prevIsLoadingRef = useRef(isLoading);

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
    staleTime: 5000, // 5 seconds
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
    // Don't retry on error
    retry: false
  });

  // Refetch progress when message count changes
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['objective-progress', conversationId] });
  }, [conversationId, messageCount]);

  // Handle loading state changes
  useEffect(() => {
    // When AI starts responding, set expectingUpdates to true
    if (isLoading) {
      setExpectingUpdates(true);
    }
    
    // When loading transitions from true to false, start the extended polling period
    if (!isLoading && prevIsLoadingRef.current) {
      // Fetch immediately when AI finishes responding
      queryClient.invalidateQueries({ queryKey: ['objective-progress', conversationId] });
    }
    
    // Update the ref for next comparison
    prevIsLoadingRef.current = isLoading;
  }, [isLoading, conversationId]);

  // Manage polling lifecycle
  useEffect(() => {
    // Clear any existing intervals and timeouts when dependencies change
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    
    // Start polling if we're loading or expecting updates
    if (isLoading || expectingUpdates) {
      // Set up polling interval
      pollingIntervalRef.current = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['objective-progress', conversationId] });
      }, 2000);
      
      // If we're no longer loading but still expecting updates, set a timeout to stop polling
      if (!isLoading && expectingUpdates) {
        pollingTimeoutRef.current = setTimeout(() => {
          setExpectingUpdates(false);
        }, 8000);
      }
    }
    
    // Cleanup function
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, [isLoading, expectingUpdates, conversationId]);

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