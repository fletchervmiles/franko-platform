import { useMutation } from "@tanstack/react-query";

/**
 * Custom hook for consolidated chat initialization
 * 
 * This hook performs both chat instance fetching and chat response creation
 * in a single API call, improving initialization speed significantly.
 * 
 * Features:
 * - Automatic retries for network failures
 * - Timeout handling
 * - Detailed error reporting
 */
export function useConsolidatedChatInit() {
  return useMutation({
    mutationFn: async ({
      chatInstanceId,
      userData,
    }: {
      chatInstanceId: string;
      userData?: {
        firstName?: string;
        email?: string;
        secondName?: string;
      };
    }) => {
      try {
        // Add a timeout to the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch('/api/chat/initialize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatInstanceId,
            ...(userData?.firstName && { intervieweeFirstName: userData.firstName }),
            ...(userData?.secondName && { intervieweeSecondName: userData.secondName }),
            ...(userData?.email && { intervieweeEmail: userData.email }),
          }),
          signal: controller.signal
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);

        if (!response.ok) {
          // Try to get detailed error message
          let errorMessage;
          try {
            const errorBody = await response.json();
            errorMessage = errorBody.message || errorBody.error || `Server error: ${response.status}`;
          } catch (e) {
            // If we can't parse JSON, use text
            errorMessage = await response.text();
          }
          
          throw new Error(errorMessage || 'Failed to initialize chat');
        }

        return response.json();
      } catch (error) {
        // Handle abort errors specifically
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Connection timed out. Please try again.');
        }
        
        // If it's already an Error instance, rethrow it
        if (error instanceof Error) {
          throw error;
        }
        
        // Otherwise, wrap unknown error in Error instance
        throw new Error('An unexpected error occurred');
      }
    },
    retry: 2, // Retry up to 2 times
    retryDelay: attemptIndex => Math.min(1000 * (2 ** attemptIndex), 5000), // Exponential backoff
  });
}