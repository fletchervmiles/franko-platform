import { useQuery } from '@tanstack/react-query';
import { ProgressBar, type Step } from "./progress-bar";
import type { ObjectiveProgress } from "@/db/schema/chat-instances-schema";
import { useEffect } from 'react';
import { queryClient } from './utilities/query-provider';

interface ConversationProgressProps {
  conversationId: string;
  messageCount: number;
}

async function fetchProgress(chatId: string): Promise<ObjectiveProgress | null> {
  const response = await fetch(`/api/progress?chatId=${chatId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch progress');
  }
  return response.json();
}

export function ConversationProgress({ conversationId, messageCount }: ConversationProgressProps) {
  const { data: progress } = useQuery<ObjectiveProgress | null>({
    queryKey: ['objective-progress', conversationId],
    queryFn: () => fetchProgress(conversationId),
    // Only refetch when the query is stale
    staleTime: Infinity,
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
    // Don't retry on error
    retry: false
  });

  // Refetch progress when message count changes
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['objective-progress', conversationId] });
  }, [conversationId, messageCount]);

  if (!progress?.objectives) {
    return null;
  }

  const steps: Step[] = Object.entries(progress.objectives)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, obj]) => ({
      label: `Objective ${id.replace(/^obj0?/, '')}`,
      status: obj.status === "done" ? "completed" 
             : obj.status === "current" ? "in-review"
             : "pending"
    }));

  return <ProgressBar steps={steps} />;
} 