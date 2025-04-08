import { Avatar } from "@/components/ui/avatar"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ToolInvocation, Message as AIMessage } from "ai"
import { motion } from "framer-motion"
import React, { ReactNode, useMemo, useEffect, useCallback } from "react"
// Import lazy-loaded components instead of the direct ones
import { 
  LazyMarkdown, 
  LazyConversationPlan, 
  LazyOptionButtons 
} from "@/components/lazy-components"

// Add interface for content items
interface ContentItem {
  type: string;
  text: string;
}

interface MessageProps {
  content: string | ReactNode | ContentItem[]
  isUser?: boolean
  timestamp?: string
  // NOTE: Tool invocations have been removed from the backend
  // This prop is kept for backward compatibility but is currently unused
  toolInvocations?: Array<ToolInvocation>
  chatId: string
  isLoading?: boolean
  messageIndex?: number
  allMessages?: Array<AIMessage>
  isFirstInTurn?: boolean
}

// Helper function to check if two strings are similar
const areSimilarTexts = (text1: string, text2: string, threshold = 0.7): boolean => {
  if (!text1 || !text2) return false;
  
  // Normalize texts for comparison
  const normalize = (text: string) => text.toLowerCase().trim();
  const normalizedText1 = normalize(text1);
  const normalizedText2 = normalize(text2);
  
  // If one is a substring of the other, they're likely similar
  if (normalizedText1.includes(normalizedText2) || normalizedText2.includes(normalizedText1)) {
    return true;
  }
  
  // Calculate similarity based on common words
  const words1 = new Set(normalizedText1.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(normalizedText2.split(/\s+/).filter(w => w.length > 3));
  
  // Find intersection of significant words
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  
  // Calculate Jaccard similarity
  const union = new Set([...words1, ...words2]);
  const similarity = intersection.size / union.size;
  
  return similarity >= threshold;
};

export const Message = React.memo(function Message({ 
  content, 
  isUser = false, 
  timestamp, 
  toolInvocations, 
  chatId, 
  isLoading = false,
  messageIndex = -1,
  allMessages = [],
  isFirstInTurn = true
}: MessageProps) {

  // Define hooks unconditionally at the top level
  const getDisplayContent = useCallback((content: string) => {
    try {
      // Handle both double-escaped and single-escaped newlines for JSON.stringify'ed responses
      // This handles the case when a response is read from the database after being JSON.stringify'ed
      let processed = content;
      
      // 1. Replace double-escaped newlines (\\n) with actual newlines
      processed = processed.replace(/\\\\n/g, '\n');
      
      // 2. Replace single-escaped newlines (\n) with actual newlines
      processed = processed.replace(/\\n/g, '\n');
      
      return processed;
    } catch (error) {
      console.error('Error processing content:', error);
      return content;
    }
  }, []);
  
  const hasDisplayableTools = useMemo(() => 
    toolInvocations?.some(
      t => t.state === "result" && t.toolName !== "searchWeb" && t.toolName !== "thinkingHelp"
    ), 
    [toolInvocations]
  );

  // Extract text content from content array if needed
  const extractedContent = useMemo(() => {
    // If content is already a string, return it directly
    if (typeof content === 'string') {
      return content;
    }
    
    // Handle array of content objects (with type and text fields)
    if (Array.isArray(content)) {
      return content
        .filter((item): item is ContentItem => 
          item && typeof item === 'object' && 'text' in item)
        .map((item: ContentItem) => item.text)
        .join('\n');
    }
    
    // For other ReactNode types, return an empty string
    return '';
  }, [content]);

  // Check if we should hide content due to duplication with tool content
  const shouldHideContent = useMemo(() => {
    if (isUser || !content) {
      return false;
    }

    // Use extracted content for string comparison
    const contentToCheck = extractedContent;
    
    if (!contentToCheck) {
      return false;
    }

    // Check if this is a duplicate message within the same turn
    if (!isFirstInTurn && messageIndex > 0 && allMessages) {
      // Find the start of the current turn
      let turnStartIndex = messageIndex;
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (allMessages[i].role !== allMessages[messageIndex].role) {
          break;
        }
        turnStartIndex = i;
      }

      // Check if this message is similar to any previous message in the same turn
      for (let i = turnStartIndex; i < messageIndex; i++) {
        const prevMessage = allMessages[i];
        const prevContent = typeof prevMessage.content === 'string' 
          ? prevMessage.content 
          : Array.isArray(prevMessage.content) 
            ? (prevMessage.content as any[])  // Cast to any[] to fix the type error
                .filter((item): item is ContentItem => 
                  item && typeof item === 'object' && 'text' in item)
                .map((item: ContentItem) => item.text)
                .join('\n')
            : '';
            
        if (prevMessage.role === allMessages[messageIndex].role && 
            prevContent && 
            areSimilarTexts(contentToCheck, prevContent, 0.8)) {
          console.log('Duplicate message detected in same turn:', { 
            current: contentToCheck.substring(0, 100), 
            previous: prevContent.substring(0, 100),
            currentIndex: messageIndex,
            previousIndex: i,
            turnStartIndex
          });
          return true;
        }
      }
    }

    return false;
  }, [extractedContent, isUser, isFirstInTurn, messageIndex, allMessages]);

  // Check for duplicate tool calls, particularly displayOptionsMultipleChoice
  const hasDuplicateToolCalls = useMemo(() => {
    // Only check for non-user messages with tool invocations that aren't the first in a turn
    if (isUser || !toolInvocations?.length || isFirstInTurn || messageIndex <= 0 || !allMessages) {
      return false;
    }

    // Find the start of the current turn
    let turnStartIndex = messageIndex;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (allMessages[i].role !== allMessages[messageIndex].role) {
        break;
      }
      turnStartIndex = i;
    }

    // Check if any previous message in the same turn has the same tool type
    for (let i = turnStartIndex; i < messageIndex; i++) {
      const prevMessage = allMessages[i];
      if (prevMessage.toolInvocations) {
        // Check if any tool in the current message matches any tool in the previous message
        const hasDuplicate = toolInvocations.some(currentTool => 
          prevMessage.toolInvocations?.some(prevTool => 
            // Specifically target displayOptionsMultipleChoice tools
            currentTool.toolName === prevTool.toolName && 
            (currentTool.toolName === "displayOptionsMultipleChoice" || 
             currentTool.toolName === "displayOptionsNumbers")
          )
        );
        
        if (hasDuplicate) {
          console.log('Duplicate tool call detected in same turn:', { 
            currentTools: toolInvocations.map(t => t.toolName), 
            previousTools: prevMessage.toolInvocations.map(t => t.toolName),
            currentIndex: messageIndex,
            previousIndex: i
          });
          return true;
        }
      }
    }
    
    return false;
  }, [isUser, toolInvocations, isFirstInTurn, messageIndex, allMessages]);

  // Add debugging for shouldHideContent
  useEffect(() => {
    if (shouldHideContent) {
      console.log('Hiding content due to duplication:', { 
        content: typeof content === 'string' ? content.substring(0, 100) : '[non-string content]',
        messageIndex,
        isFirstInTurn
      });
    }
  }, [shouldHideContent, content, messageIndex, isFirstInTurn]);

  // Skip rendering completely if this is a duplicate message OR has duplicate tool calls
  // This prevents the empty gap from appearing
  if (shouldHideContent || hasDuplicateToolCalls) {
    console.log('Skipping rendering of duplicate message:', { 
      messageIndex, 
      reason: shouldHideContent ? 'duplicate content' : 'duplicate tool calls' 
    });
    return null;
  }

  // Only skip rendering for completely empty assistant messages with no tool results
  // and not in a loading state
  if (!isUser && 
      !isLoading && 
      !content && 
      (!toolInvocations?.length || 
       toolInvocations.every(t => t.toolName === "searchWeb" || t.toolName === "thinkingHelp")))
  {
    console.log('Skipping empty message with no displayable tools');
    return null;
  }

  // Add logging to help with debugging
  console.log('Rendering message:', { 
    isUser, 
    messageIndex,
    hasTools: !!toolInvocations?.length,
    toolNames: toolInvocations?.map(t => t.toolName),
    toolStates: toolInvocations?.map(t => t.state),
    contentType: typeof content,
    contentLength: typeof content === 'string' ? content.length : Array.isArray(content) ? extractedContent.length : 0,
    contentPreview: typeof content === 'string' ? content.substring(0, 100) : Array.isArray(content) ? extractedContent.substring(0, 100) : '[non-string content]',
    isFirstInTurn
  });

  // Determine if we should show loading state
  const showLoading = isLoading && !content && !toolInvocations?.length;

  return (
    <motion.div 
      className={cn(
        "group flex w-full max-w-4xl mx-auto transition-opacity",
        "hover:opacity-100 px-4 md:px-8 lg:px-14"
      )}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className={cn(
        "flex flex-col gap-1 w-full",
        isUser ? "items-end" : "items-start"
      )}>
        {timestamp && (
          <div className="text-xs text-gray-400 transition-opacity opacity-0 group-hover:opacity-100">
            {timestamp}
          </div>
        )}
        <div className={cn(
          "text-base max-w-[85%]",
          isUser 
            ? "bg-white text-gray-900 rounded-3xl rounded-br-lg border border-gray-200 px-4 py-2.5" // Increased roundness while maintaining speech bubble effect
            : "bg-transparent text-gray-900 rounded-lg px-4 py-2.5"
        )}>
          {!isUser && showLoading && (
            <div className="flex items-center h-7">
              <div className="flex space-x-2 items-end bg-gray-100 px-4 py-2.5 rounded-xl">
                <div className="w-2.5 h-2.5 bg-gray-600 rounded-full animate-[typing_1.2s_ease-in-out_infinite]"></div>
                <div className="w-2.5 h-2.5 bg-gray-600 rounded-full animate-[typing_1.2s_ease-in-out_infinite_0.2s]"></div>
                <div className="w-2.5 h-2.5 bg-gray-600 rounded-full animate-[typing_1.2s_ease-in-out_infinite_0.4s]"></div>
              </div>
            </div>
          )}
          
          {/* Show content if it exists - use lazy loaded markdown */}
          {content && (
            <>
              {/* Debug view to see what raw content we're receiving */}
              {isUser === false && process.env.NODE_ENV === 'development' && (
                <div className="text-xs mb-2 text-red-400 hidden">
                  Raw content contains \n: {typeof content === 'string' && content.includes('\\n') ? 'YES' : 'NO'}
                </div>
              )}
              <LazyMarkdown>
                {
                  // Clean up all escaped newlines here, right at the point where the text is used
                  typeof extractedContent === 'string' ? 
                    extractedContent
                      .replace(/\\\\n/g, '\n')  // Handle double-escaped newlines: \\n → \n
                      .replace(/\\n/g, '\n')    // Handle standard escaped newlines: \n → actual newline
                    : extractedContent
                }
              </LazyMarkdown>
            </>
          )}

          {/* NOTE: Tool invocations have been removed from the backend
              This section previously handled various tool responses like:
              - endConversation
              - displayOptionsMultipleChoice
              - searchWeb
              These may be re-implemented in a future update */}
        </div>
      </div>
    </motion.div>
  );
});