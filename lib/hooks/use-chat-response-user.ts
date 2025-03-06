import { useQuery } from "@tanstack/react-query";

/**
 * Custom hook to fetch chat response user data (used for personalized greeting)
 * 
 * Benefits:
 * - Automatic caching with staleTime of 5 minutes
 * - Loading state handling
 * - Error handling
 */
export function useChatResponseUser(chatResponseId: string) {
  return useQuery({
    queryKey: ['chatResponse', chatResponseId, 'user'],
    queryFn: async () => {
      const res = await fetch(`/api/chat-responses/${chatResponseId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch chat response user data");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    // Only fetch if we have a chat response ID
    enabled: !!chatResponseId,
  });
}