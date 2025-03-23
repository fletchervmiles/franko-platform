import { useState, useEffect } from 'react';
import { Message } from 'ai';
import { processMessages } from '@/lib/utils/message-processor';

interface UseChatHistoryOptions {
  chatResponseId: string | null;
  enabled?: boolean;
}

interface UseChatHistoryResult {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and process chat history
 */
export function useChatHistory({ 
  chatResponseId, 
  enabled = true 
}: UseChatHistoryOptions): UseChatHistoryResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch chat history
  const fetchHistory = async () => {
    if (!chatResponseId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the history API endpoint
      const response = await fetch(`/api/external-chat/history?responseId=${chatResponseId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.status} ${response.statusText}`);
      }
      
      const rawMessages = await response.json();
      
      // Process messages for display 
      const processedMessages = processMessages(rawMessages);
      
      setMessages(processedMessages);
      console.log('Chat history loaded:', processedMessages.length, 'messages');
    } catch (err) {
      console.error('Error fetching chat history:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch history when chatResponseId changes or enabled status changes
  useEffect(() => {
    if (chatResponseId && enabled) {
      fetchHistory();
    }
  }, [chatResponseId, enabled]);

  return {
    messages,
    isLoading,
    error,
    refetch: fetchHistory
  };
} 