import { useState, useCallback, useEffect, useRef } from 'react';
import { Message } from 'ai';
import { generateUUID } from '@/lib/utils';

// Extended Message interface to include objectives data
interface ExtendedMessage extends Message {
  objectives?: Record<string, { status: string, count?: number, target?: number, guidance?: string }> | null;
}

interface UseExternalChatOptions {
  api: string;
  id: string;
  body?: Record<string, unknown>;
  initialMessages?: ExtendedMessage[];
  onResponse?: (response: Response) => void | Promise<void>;
  onFinish?: (message: ExtendedMessage) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}

export function useExternalChat({
  api,
  id,
  body,
  initialMessages = [],
  onResponse,
  onFinish,
  onError,
}: UseExternalChatOptions) {
  const [messages, setMessages] = useState<ExtendedMessage[]>(initialMessages);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Function to handle stopping the request
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  // Reset the conversation
  const reset = useCallback(() => {
    stop();
    setMessages(initialMessages);
    setError(null);
  }, [initialMessages, stop]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Don't submit empty messages
      if (!input.trim()) {
        return;
      }

      // Don't allow new submissions while loading
      if (isLoading) {
        return;
      }

      // Create user message
      const userMessage: ExtendedMessage = {
        id: generateUUID(),
        role: 'user',
        content: input,
      };

      // Update messages state
      setMessages((messages) => [...messages, userMessage]);
      
      // Clear input
      setInput('');
      
      // Set loading state
      setIsLoading(true);
      setError(null);

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        // Make the API call
        const response = await fetch(api, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            id,
            ...body,
          }),
          signal: abortControllerRef.current.signal,
        });

        // Call onResponse callback if provided
        if (onResponse) {
          await onResponse(response);
        }

        // Check for error responses
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to get a response');
        }

        // Parse the JSON response
        const data = await response.json();
        
        // Create the assistant message with both objectives and fullResponse
        const assistantMessage: ExtendedMessage & { fullResponse?: string } = {
          id: data.id || generateUUID(),
          role: 'assistant',
          content: data.content,
          // Include objectives data for the progress bar
          objectives: data.objectives || null,
          // Store the full response for future turns
          fullResponse: data.fullResponse
        };

        console.log('Received assistant message with objectives:', 
          assistantMessage.objectives ? 'yes' : 'no');

        // Update messages state
        setMessages((messages) => [...messages, assistantMessage]);
        
        // Call onFinish callback if provided
        if (onFinish) {
          await onFinish(assistantMessage);
        }
      } catch (err) {
        // Ignore abort errors
        if ((err as Error).name === 'AbortError') {
          return;
        }
        
        const error = err as Error;
        setError(error);
        
        // Call onError callback if provided
        if (onError) {
          await onError(error);
        }
      } finally {
        // Reset loading state and abort controller
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [api, body, id, input, isLoading, messages, onError, onFinish, onResponse]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setInput,
    stop,
    reset,
  };
} 