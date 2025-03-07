/**
 * Custom hook for warming up the prompt cache as early as possible
 * This helps reduce the latency of the first AI interaction
 * 
 * The hook makes a request to the prompt-cache-warmup endpoint,
 * which directly populates the prompt cache without an HTTP round trip.
 */

import { useEffect, useState } from 'react';

export function usePromptWarmup(chatInstanceId: string) {
  const [isWarming, setIsWarming] = useState(false);
  const [isWarmed, setIsWarmed] = useState(false);
  const [promptLength, setPromptLength] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip if we don't have a chat instance ID or if we're already warming/warmed
    if (!chatInstanceId || isWarming || isWarmed) return;

    async function warmPromptCache() {
      setIsWarming(true);
      
      try {
        const response = await fetch('/api/prompt-cache-warmup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chatInstanceId }),
          // No need for a signal/abort - the new implementation is fast and reliable
        });
        
        // Parse the response to get more details about the warmup
        const result = await response.json();
        
        if (response.ok) {
          setIsWarmed(true);
          
          // Store the prompt length as an indicator of successful warming
          if (result.promptLength) {
            setPromptLength(result.promptLength);
          }
          
          // Use a less noisy logging approach
          if (process.env.NODE_ENV !== 'production') {
            console.log(`Prompt cache warmed successfully (${result.promptLength} chars)`);
          }
        } else {
          // Don't throw, just log - this is a performance optimization, not critical functionality
          console.warn('Failed to warm prompt cache:', result.message || result.error || 'Unknown error');
        }
      } catch (err) {
        // Only log in development to reduce noise
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Error warming prompt cache:', err);
        }
        setError(err as Error);
      } finally {
        setIsWarming(false);
      }
    }

    // Call the function immediately when the component mounts
    warmPromptCache();
    
    // No cleanup needed - this is a fire-and-forget operation
  }, [chatInstanceId, isWarming, isWarmed]);

  return { isWarming, isWarmed, promptLength, error };
}