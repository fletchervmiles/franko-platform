import { Avatar } from "@/components/ui/avatar"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ToolInvocation } from "ai"
import { motion } from "framer-motion"
import { ReactNode } from "react"
import { Markdown } from "@/components/custom/markdown"
import { ConversationPlan } from "@/components/custom/conversation-plan"
import { OptionButtons } from "@/components/custom/OptionButtons"

interface MessageProps {
  content: string | ReactNode
  isUser?: boolean
  timestamp?: string
  toolInvocations?: Array<ToolInvocation>
  chatId: string
  isLoading?: boolean
}

export function Message({ content, isUser = false, timestamp, toolInvocations, chatId, isLoading = false }: MessageProps) {
  // Skip rendering if empty assistant message with no tool results AND not loading
  if (!isUser && 
      !isLoading && // Don't skip if loading
      ((!content || content === "" || (typeof content === "string" && content.trim() === "")) && 
       (!toolInvocations?.length || 
        toolInvocations.every(t => t.toolName === "searchWeb")))
  ) {
    return null;
  }

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

  // Determine if we should show loading state
  const showLoading = isLoading && !content && !toolInvocations?.length;

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
            : "bg-gray-100 text-gray-900"
        )}>
          {!isUser && showLoading && (
            <div className="flex gap-1 h-6 items-center">
              <span className="w-1 h-1 rounded-full bg-gray-400 animate-[bounce_1.4s_infinite_0.2s]" />
              <span className="w-1 h-1 rounded-full bg-gray-400 animate-[bounce_1.4s_infinite_0.4s]" />
              <span className="w-1 h-1 rounded-full bg-gray-400 animate-[bounce_1.4s_infinite_0.6s]" />
            </div>
          )}
          
          {content && typeof content === "string" && (
            <Markdown>{getDisplayContent(content)}</Markdown>
          )}

          {toolInvocations && chatId && (
            toolInvocations.map((toolInvocation) => {
              const { toolName, toolCallId, state } = toolInvocation;

              if (state === "result") {
                const { result } = toolInvocation;

                if (toolName === "searchWeb") return null;

                return (
                  <div key={toolCallId}>
                    {toolName === "displayOptions" && result?.type === "options" ? (
                      <OptionButtons 
                        options={result.display} 
                        chatId={chatId}
                        text={result.text}
                      />
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
                    {toolName === "displayOptions" ? (
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
  )
}

