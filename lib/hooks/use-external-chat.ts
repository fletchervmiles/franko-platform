import { useState, useCallback, useEffect, useRef } from 'react';
import { Message } from 'ai';
import { generateUUID } from '@/lib/utils';

// Extended Message interface to include objectives data
interface ExtendedMessage extends Message {
  objectives?: Record<string, { status: string, count?: number, target?: number, guidance?: string }> | null;
  fullContent?: string;
  displayContent?: string;
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
    async (e: React.FormEvent<HTMLFormElement>, forcedContent?: string) => {
      e.preventDefault();

      // Check if this is an auto-greeting
      const isAutoGreeting = 'isAutoGreeting' in e;
      
      if (isAutoGreeting) {
        console.log('Processing auto-greeting submission');
      }
      
      // Use the forced content (for auto-greetings) or input state
      const messageContent = forcedContent || input;
      
      // Don't submit empty messages (unless we have forced content)
      if (!forcedContent && !input.trim()) {
        console.log('Rejecting empty message submission');
        return false;
      }

      // Don't allow new submissions while loading
      if (isLoading) {
        console.log('Rejecting submission while already loading');
        return false;
      }
      
      // For auto-greetings, check sessionStorage to prevent duplicates
      if (isAutoGreeting) {
        const greetingKey = `sent-greeting-${id}`;
        try {
          // Try to get from sessionStorage, handling potential exceptions
          const existing = sessionStorage.getItem(greetingKey);
          if (existing) {
            console.log('Preventing duplicate auto-greeting for chat:', id);
            return false;
          }
          // Mark this greeting as sent in session storage
          sessionStorage.setItem(greetingKey, 'true');
          console.log('Marked greeting as sent in sessionStorage:', greetingKey);
        } catch (storageError) {
          // If sessionStorage fails (e.g., private browsing), log and continue
          console.warn('SessionStorage error, proceeding anyway:', storageError);
        }
      }

      // Create user message with either forced content or input
      const userMessage: ExtendedMessage = {
        id: generateUUID(),
        role: 'user',
        content: messageContent,
      };

      console.log('Created user message:', {
        id: userMessage.id,
        content: userMessage.content.substring(0, 50) + (userMessage.content.length > 50 ? '...' : '')
      });

      // Update messages state
      setMessages((messages) => [...messages, userMessage]);
      
      // Clear input (only if we used the actual input field)
      if (!forcedContent) {
        setInput('');
      }
      
      // Set loading state
      setIsLoading(true);
      setError(null);

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        console.log('Sending API request to:', api);
        
        // Prepare messages with original content when available
        const apiMessages = messages.map(message => {
          // If it's an assistant message with fullContent, use the original content
          if (message.role === 'assistant' && 'fullContent' in message) {
            return {
              ...message,
              content: message.fullContent
            };
          }
          return message;
        });

        // Log the API messages for debugging
        console.log('Sending messages to API:');
        apiMessages.forEach((message, index) => {
          if (message.role === 'assistant') {
            const hasFullContent = 'fullContent' in message && typeof message.fullContent === 'string';
            const originalContent = hasFullContent ? (message as any).fullContent : message.content;
            const sentContent = message.content;
            
            console.log(`Assistant message ${index}:`, {
              id: message.id,
              hasFullContent,
              originalLength: hasFullContent ? originalContent.length : 0,
              sentLength: typeof sentContent === 'string' ? sentContent.length : 0,
              usingFullContent: hasFullContent && sentContent === originalContent
            });
          }
        });

        // Make the API call with full content preserved
        const response = await fetch(api, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...apiMessages, userMessage],
            id,
            ...body,
          }),
          signal: abortControllerRef.current.signal,
        });

        console.log('Received API response, status:', response.status);

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
        console.log('Successfully parsed response data');
        
        // Helper function to extract response from potentially formatted content
        const extractDisplayContent = (content: any): string => {
          // If it's not a string, convert it to string
          if (typeof content !== 'string') {
            return String(content);
          }
          
          // Check for JSON wrapped in markdown code blocks
          if (content.includes('```json') && content.includes('```')) {
            try {
              const jsonText = content.split('```json\n')[1]?.split('\n```')[0];
              if (jsonText) {
                const parsed = JSON.parse(jsonText);
                return parsed.response || content;
              }
            } catch (e) {
              console.error('Error parsing JSON in markdown blocks:', e);
            }
          }
          
          // Check if the content itself is a JSON string
          if ((content.startsWith('{') && content.endsWith('}')) || 
              (content.startsWith('[') && content.endsWith(']'))) {
            try {
              const parsed = JSON.parse(content);
              if (parsed.response) {
                return parsed.response;
              }
            } catch (e) {
              // Not valid JSON - just use the content as is
              console.log('Content is not valid JSON, using as is');
            }
          }
          
          // If we have a separate response field at the top level, use that
          if (data.response && typeof data.response === 'string') {
            return data.response;
          }
          
          // Default to the original content
          return content;
        };
        
        // Get the display content
        const displayContent = extractDisplayContent(data.content);
        console.log('Extracted display content:', displayContent.substring(0, 50) + '...');
        
        // Create the assistant message with both objectives and fullResponse
        const assistantMessage: ExtendedMessage & { fullResponse?: string } = {
          id: data.id || generateUUID(),
          role: 'assistant',
          content: displayContent,
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
        
        return true;
      } catch (err) {
        // Ignore abort errors
        if ((err as Error).name === 'AbortError') {
          console.log('Request was aborted');
          return false;
        }
        
        const error = err as Error;
        console.error('Error in handleSubmit:', error);
        setError(error);
        
        // Call onError callback if provided
        if (onError) {
          await onError(error);
        }
        
        return false;
      } finally {
        console.log('Finishing request, resetting loading state');
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