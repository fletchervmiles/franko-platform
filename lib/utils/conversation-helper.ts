/**
 * Conversation Helper Utility
 * 
 * Provides utility functions for extracting and analyzing data from conversations:
 * - Extracting objectives from the latest message
 * - Checking if all objectives are complete
 * - Detecting conversation ending phrases
 */

// Import necessary types
import { logger } from "@/lib/logger";

/**
 * Interface for objective status from AI responses
 */
interface ObjectiveStatus {
  status: 'done' | 'current' | 'tbc';
  count?: number;
  target?: number;
  guidance?: string;
}

/**
 * Interface for a message in the messagesJson format
 */
interface RawMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  objectives?: Record<string, ObjectiveStatus> | null;
  fullResponse?: string;
  createdAt?: string | Date;
}

/**
 * Extracts objectives data from the latest assistant message
 * 
 * @param messagesJson - Messages in JSON string or array format
 * @returns Record of objectives or null if not found
 */
export function getLatestObjectives(
  messagesJson: string | RawMessage[]
): Record<string, ObjectiveStatus> | null {
  try {
    // Parse messages if provided as a string
    const messages: RawMessage[] = Array.isArray(messagesJson) 
      ? messagesJson 
      : JSON.parse(messagesJson);
    
    // Filter for assistant messages and get the most recent one
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    if (assistantMessages.length === 0) {
      logger.debug('No assistant messages found');
      return null;
    }
    
    // Get the latest assistant message
    const lastMessage = assistantMessages[assistantMessages.length - 1];
    
    // If objectives are directly attached to the message (from API)
    if (lastMessage.objectives) {
      logger.debug('Using objectives directly from message');
      return lastMessage.objectives;
    }
    
    // Otherwise, check for fullResponse first (if available)
    if (lastMessage.fullResponse) {
      try {
        // Try to extract JSON from the full response
        const jsonMatch = lastMessage.fullResponse.match(/```json\n([\s\S]*?)\n```/);
        
        if (jsonMatch && jsonMatch[1]) {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.currentObjectives) {
            logger.debug('Extracted objectives from fullResponse');
            return parsed.currentObjectives;
          }
        }
      } catch (e) {
        logger.error('Error parsing fullResponse:', e);
      }
    }
    
    // Fall back to parsing from content
    try {
      const content = lastMessage.content;
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      
      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.currentObjectives) {
          logger.debug('Extracted objectives from content');
          return parsed.currentObjectives;
        }
      }
    } catch (e) {
      logger.error('Error extracting objectives from content:', e);
    }
    
    logger.debug('No objectives found in the latest assistant message');
    return null;
  } catch (error) {
    logger.error('Error in getLatestObjectives:', error);
    return null;
  }
}

/**
 * Checks if all objectives in a set are marked as 'done'
 * 
 * @param objectives - Record of objectives
 * @returns true if all objectives are 'done', false otherwise
 */
export function isAllObjectivesDone(
  objectives: Record<string, ObjectiveStatus> | null
): boolean {
  if (!objectives || Object.keys(objectives).length === 0) {
    return false;
  }
  
  return Object.values(objectives).every(obj => obj.status === 'done');
}

/**
 * Checks if text contains phrases indicating the conversation is ending
 * 
 * @param text - The text to check
 * @returns true if ending phrases are found, false otherwise
 */
export function hasEndingPhrases(text: string): boolean {
  if (!text) return false;
  
  const endPhrases = [
    "we've now concluded the conversation",
    "concluded the Conversation",
    "thanks for your time today",
    "that concludes our conversation",
    "this completes our discussion",
    "we've now completed our chat",
    "have a great day and thanks again"
  ];
  
  // Case-insensitive check for any ending phrase
  return endPhrases.some(phrase => 
    text.toLowerCase().includes(phrase.toLowerCase())
  );
}

/**
 * Extracts the plain text response from an assistant message
 * 
 * @param messageContent - Message content, which might contain JSON
 * @returns Extracted response text or the original content if parsing fails
 */
export function extractResponseText(messageContent: string): string {
  try {
    // Check if content contains JSON
    const jsonMatch = messageContent.match(/```json\n([\s\S]*?)\n```/);
    
    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1]);
      
      // Return the response field if available
      if (parsed.response) {
        return parsed.response;
      }
    }
    
    // If there's no JSON or no response field, return the original content
    return messageContent;
  } catch (e) {
    logger.error('Error extracting response text:', e);
    return messageContent;
  }
} 