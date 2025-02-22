import { useQuery } from '@tanstack/react-query';
import { ProgressBar, type Step } from "./progress-bar";
import type { ObjectiveProgress } from "@/db/schema/chat-instances-schema";

interface ConversationProgressProps {
  conversationId: string;
}

async function fetchProgress(chatId: string): Promise<ObjectiveProgress | null> {
  const response = await fetch(`/api/progress?chatId=${chatId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch progress');
  }
  return response.json();
}

export function ConversationProgress({ conversationId }: ConversationProgressProps) {
  const { data: progress, isLoading } = useQuery<ObjectiveProgress | null>({
    queryKey: ['objective-progress', conversationId],
    queryFn: () => fetchProgress(conversationId),
    refetchOnWindowFocus: true,
  });

  console.log('Progress data in ConversationProgress:', progress);

  if (isLoading || !progress) return null;

  const steps: Step[] = Object.entries(progress.objectives).map(([id, obj]) => {
    console.log('Processing objective:', { id, obj });
    return {
      label: `Objective ${id.replace(/^obj0?/, '')}`, // Handles both "obj1" and "obj01" formats
      status: obj.status === "done" ? "completed" 
             : obj.status === "current" ? "in-review"
             : "pending"
    };
  });

  console.log('Rendered steps:', steps);

  return <ProgressBar steps={steps} />;
} 