import { Avatar } from "@/components/ui/avatar"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ToolInvocation, Message as AIMessage } from "ai"
import { motion } from "framer-motion"
import { ReactNode, useMemo, useEffect } from "react"
import { Markdown } from "@/components/custom/markdown"
import { ConversationPlan } from "@/components/conversation-plan"
import { OptionButtons } from "@/components/OptionButtons"

interface MessageProps {
  content: string | ReactNode
  isUser?: boolean
  timestamp?: string
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

export function Message({ 
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
  // Check if we should hide content due to duplication with tool content
  const shouldHideContent = useMemo(() => {
    if (isUser || !content || typeof content !== 'string') {
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
        if (prevMessage.role === allMessages[messageIndex].role && 
            typeof prevMessage.content === 'string' && 
            areSimilarTexts(content, prevMessage.content, 0.8)) {
          console.log('Duplicate message detected in same turn:', { 
            current: content.substring(0, 100), 
            previous: prevMessage.content.substring(0, 100),
            currentIndex: messageIndex,
            previousIndex: i,
            turnStartIndex
          });
          return true;
        }
      }
    }

    return false;
  }, [content, isUser, isFirstInTurn, messageIndex, allMessages]);

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

  // Skip rendering completely if this is a duplicate message
  // This prevents the empty gap from appearing
  if (shouldHideContent) {
    console.log('Skipping rendering of duplicate message:', { messageIndex });
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
    contentLength: typeof content === 'string' ? content.length : 0,
    contentPreview: typeof content === 'string' ? content.substring(0, 100) : '[non-string content]',
    isFirstInTurn
  });

  const getDisplayContent = (content: string) => {
    try {
      if (content.includes('```json') && content.includes('```')) {
        const jsonStr = content.split('```json\n')[1].split('\n```')[0];
        const parsed = JSON.parse(jsonStr);
        return parsed.response;
      }
      return content;
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return content;
    }
  };

  // Determine if we have displayable tool invocations (not searchWeb or thinkingHelp)
  const hasDisplayableTools = toolInvocations?.some(
    t => t.state === "result" && t.toolName !== "searchWeb" && t.toolName !== "thinkingHelp"
  );

  // Determine if we should show loading state
  const showLoading = isLoading && !content && !toolInvocations?.length;

  // Render avatar or spacer based on isFirstInTurn
  const renderAvatarOrSpacer = () => {
    if (isFirstInTurn) {
      return (
        <Avatar className={cn(
          "h-6 w-6 flex-shrink-0 transition-transform group-hover:scale-105",
          isUser ? "ring-1 ring-blue-500 ring-offset-1 ring-offset-white" : "",
          "mt-1.5"
        )}>
          <div className="flex h-full w-full items-center justify-center rounded-full overflow-hidden">
            <Image
              src={isUser ? "/assets/user_avatar.svg" : "/favicon/favicon.svg"}
              alt={isUser ? "User Avatar" : "AI Avatar"}
              width={18}
              height={18}
              className="h-full w-full object-cover"
            />
          </div>
        </Avatar>
      );
    } else {
      return <div className="w-6 flex-shrink-0" />; // Spacer for alignment
    }
  };

  return (
    <motion.div 
      className={cn(
        "group flex gap-3 w-full max-w-3xl mx-auto transition-opacity",
        isUser ? "flex-row-reverse" : "",
        "hover:opacity-100 px-4 md:px-8"
      )}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      {renderAvatarOrSpacer()}

      <div className={cn(
        "flex flex-col gap-1",
        isUser ? "items-end" : "items-start",
        "flex-1"
      )}>
        {timestamp && (
          <div className="text-xs text-gray-400 transition-opacity opacity-0 group-hover:opacity-100">
            {timestamp}
          </div>
        )}
        <div className={cn(
          "rounded-lg px-3 py-1.5 text-base",
          isUser 
            ? "bg-blue-500 text-white" 
            : "bg-transparent text-gray-900"
        )}>
          {!isUser && showLoading && (
            <div className="flex items-center h-6">
              <div className="w-16 h-0.5 bg-gray-100 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
              </div>
            </div>
          )}
          
          {/* Show content if it exists */}
          {content && typeof content === "string" && (
            <Markdown>{getDisplayContent(content)}</Markdown>
          )}

          {toolInvocations && chatId && (
            toolInvocations.map((toolInvocation) => {
              const { toolName, toolCallId, state } = toolInvocation;

              if (state === "result") {
                const { result } = toolInvocation;

                // Skip rendering for searchWeb and thinkingHelp tools
                if (toolName === "searchWeb" || toolName === "thinkingHelp") return null;

                // Special handling for endConversation tool
                if (toolName === "endConversation") {
                  return (
                    <div key={toolCallId}>
                      <p>{result.message}</p>
                    </div>
                  );
                }

                // Add logging to help with debugging
                console.log(`Rendering tool result for ${toolName}:`, { 
                  hasType: !!result?.type, 
                  type: result?.type,
                  hasOptions: !!result?.options,
                  hasText: !!result?.text,
                  toolName
                });

                return (
                  <div key={toolCallId}>
                    {(toolName === "displayOptionsMultipleChoice" || toolName === "displayOptionsNumbers") && 
                     result?.type === "options" ? (
                      <div>
                        {/* Show text above options if provided */}
                        {result.text && (
                          <div className="mb-2 text-sm text-gray-500">{result.text}</div>
                        )}
                        <OptionButtons 
                          options={result.options} 
                          chatId={chatId}
                        />
                      </div>
                    ) : toolName === "generateConversationPlan" ? (
                      <ConversationPlan 
                        plan={result} 
                      />
                    ) : (
                      <div>{JSON.stringify(result, null, 2)}</div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div key={toolCallId} className="skeleton">
                    {(toolName === "displayOptionsMultipleChoice" || toolName === "displayOptionsNumbers") ? (
                      <OptionButtons options={[]} chatId={chatId} />
                    ) : toolName === "generateConversationPlan" ? (
                      <ConversationPlan />
                    ) : null}
                  </div>
                );
              }
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}

