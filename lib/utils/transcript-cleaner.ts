/**
 * Transcript Cleaner Utility
 * 
 * Cleans and formats chat transcripts from messagesJson to a readable format.
 * Removes system and tool messages, preserves markdown, and formats user/assistant messages.
 */

/**
 * Interface for a message in the messagesJson format
 */
interface RawMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | Array<{type?: string, text?: string}> | Record<string, unknown>;
  experimental_providerMetadata?: {
    metadata?: {
      type?: string,
      isVisible?: boolean
    }
  };
}

/**
 * Cleans and formats a chat transcript from messagesJson
 * 
 * @param messagesJson - JSON string of messages
 * @param userName - Optional user name to display instead of "Respondent"
 * @returns Formatted transcript as a string
 */
export function cleanTranscript(messagesJson: string, userName?: string): string {
  // Default user name if not provided
  const userDisplayName = userName || "Respondent";
  const assistantDisplayName = "Agent";
  
  try {
    // Parse the JSON string into an array of messages
    const messages: RawMessage[] = JSON.parse(messagesJson);
    
    // Filter and format the messages
    const formattedMessages = messages
      // Filter out system and tool messages
      .filter(message => 
        message.role !== 'system' && 
        message.role !== 'tool' &&
        // Also filter out messages with experimental metadata marked as not visible
        !(message.experimental_providerMetadata?.metadata?.isVisible === false)
      )
      // Format each message
      .map(message => {
        // Determine the speaker name based on role
        const speakerName = message.role === 'user' ? userDisplayName : assistantDisplayName;
        
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
            .join('\n\n');
        } else if (message.content && typeof message.content === 'object') {
          // If content is an object, convert to string
          textContent = JSON.stringify(message.content);
        } else {
          // Default to empty string for null/undefined
          textContent = '';
        }
        
        // Skip empty messages
        if (!textContent.trim()) {
          return '';
        }
        
        // Format the message with speaker name and content
        return `${speakerName}: ${textContent}`;
      })
      // Filter out any empty strings that might result from the processing
      .filter(text => text.length > 0);
    
    // Join messages with double newlines for readability
    return formattedMessages.join('\n\n');
  } catch (error) {
    console.error('Error cleaning transcript:', error);
    return `Error: Could not parse or clean transcript. ${error instanceof Error ? error.message : ''}`;
  }
}