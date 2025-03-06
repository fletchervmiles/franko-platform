import { useMutation } from "@tanstack/react-query";

/**
 * Custom hook to initialize a chat response
 * 
 * Benefits:
 * - Handles loading state
 * - Manages error state 
 * - Consistent error handling
 */
export function useInitializeChatResponse() {
  return useMutation({
    mutationFn: async ({
      chatInstanceId,
      userData,
    }: {
      chatInstanceId: string;
      userData?: {
        firstName?: string;
        email?: string;
      };
    }) => {
      const response = await fetch('/api/chat-responses/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatInstanceId,
          ...(userData?.firstName && { intervieweeFirstName: userData.firstName }),
          ...(userData?.email && { intervieweeEmail: userData.email }),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to initialize chat');
      }

      return response.json();
    },
  });
}