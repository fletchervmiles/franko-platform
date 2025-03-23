import { Message } from "ai";

/**
 * Extracts the display content from a potentially JSON-formatted assistant message
 * @param content The message content to process
 * @returns The extracted readable content
 */
export function extractDisplayContent(content: string): string {
  if (!content) return '';
  
  try {
    // Check for JSON wrapped in markdown code blocks
    if (content.includes('```json') && content.includes('```')) {
      const jsonStr = content.split('```json\n')[1]?.split('\n```')[0];
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        return parsed.response || content;
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
    
    // Return original content if no processing needed
    return content;
  } catch (error) {
    console.error('Error extracting display content:', error);
    return content;
  }
}

/**
 * Extracts objectives data from a message for progress tracking
 */
export function extractObjectives(content: string) {
  try {
    if (content.includes('```json') && content.includes('```')) {
      const jsonStr = content.split('```json\n')[1]?.split('\n```')[0];
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        return parsed.currentObjectives || null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error extracting objectives:', error);
    return null;
  }
}

/**
 * Process raw messages from database to be displayed in UI
 * - Extracts readable content from JSON but preserves original content
 * - Adds turn information for message grouping
 * - Preserves objectives for progress tracking
 */
export function processMessages(messages: any[]): Message[] {
  if (!messages || !Array.isArray(messages)) return [];
  
  console.log('Processing messages for display:', messages.length);
  
  return messages.map((message, index) => {
    // Process assistant messages to extract readable content
    if (message.role === 'assistant' && typeof message.content === 'string') {
      const displayContent = extractDisplayContent(message.content);
      const objectives = extractObjectives(message.content);
      
      // Log the original and processed content lengths
      const originalLength = message.content.length;
      const displayLength = displayContent.length;
      console.log(`Message ${index}: Original content: ${originalLength} chars, Display content: ${displayLength} chars`);
      
      return {
        ...message,
        displayContent: displayContent, // Store cleaned content separately
        fullContent: message.content,   // Preserve the original full content
        content: displayContent,        // Set visible content to the cleaned version
        objectives: objectives,
        isFirstInTurn: index === 0 || messages[index - 1]?.role !== message.role
      };
    }
    
    // Add turn information to all messages
    return {
      ...message,
      isFirstInTurn: index === 0 || messages[index - 1]?.role !== message.role
    };
  });
} 