/**
 * Word Counter Utility
 * 
 * Counts the number of words in user messages from messagesJson.
 * Only counts words from user messages, not from assistant or system messages.
 */

import { logger } from '@/lib/logger';

/**
 * Interface for a message in the messagesJson format
 */
interface RawMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | Array<{type?: string, text?: string}> | Record<string, unknown>;
}

/**
 * Counts the number of words in user messages
 * 
 * @param messagesJson - JSON string of messages
 * @returns Total word count from user messages
 */
export function countUserWords(messagesJson: string): number {
  try {
    // Parse the JSON string into an array of messages
    const messages: RawMessage[] = JSON.parse(messagesJson);
    
    // Filter for user messages only
    const userMessages = messages.filter(message => message.role === 'user');
    
    // Count words in each user message
    let totalWordCount = 0;
    
    for (const message of userMessages) {
      // Extract the content based on its type
      let textContent: string;
      
      if (typeof message.content === 'string') {
        // If content is a string, use it directly
        textContent = message.content;
      } else if (Array.isArray(message.content)) {
        // If content is an array, extract text fields
        textContent = message.content
          .map(item => item.text || '')
          .filter(text => text.length > 0)
          .join(' ');
      } else if (message.content && typeof message.content === 'object') {
        // If content is an object, convert to string
        textContent = JSON.stringify(message.content);
      } else {
        // Default to empty string for null/undefined
        textContent = '';
      }
      
      // Count words using regex to split by whitespace
      const words = textContent.trim().match(/\S+/g) || [];
      totalWordCount += words.length;
    }
    
    return totalWordCount;
  } catch (error) {
    logger.error('Error counting user words:', error);
    return 0;
  }
}