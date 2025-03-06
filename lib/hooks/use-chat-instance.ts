import { useQuery } from "@tanstack/react-query";
import { getChatInstanceById } from "@/db/queries/chat-instances-queries";

/**
 * Custom hook to fetch and cache chat instance data
 * 
 * Benefits:
 * - Automatic caching with staleTime of 5 minutes
 * - Loading state handling
 * - Error handling
 * - Refetching on failure
 */
export function useChatInstance(id: string) {
  return useQuery({
    queryKey: ['chatInstance', id],
    queryFn: () => getChatInstanceById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes - cache the chat instance for this long
    retry: 2,                 // Retry failed requests up to 2 times
    refetchOnWindowFocus: false,
  });
}