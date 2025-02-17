import { Avatar } from "@/components/ui/avatar"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface MessageProps {
  content: string
  isUser?: boolean
  timestamp?: string
}

export function Message({ content, isUser = false, timestamp }: MessageProps) {
  return (
    <div 
      className={cn(
        "group flex gap-3 w-full max-w-3xl mx-auto transition-opacity",
        isUser ? "flex-row-reverse" : "",
        "hover:opacity-100 px-4 md:px-8"
      )}
    >
      <Avatar className={cn(
        "h-6 w-6 flex-shrink-0 transition-transform group-hover:scale-105",
        isUser ? "ring-1 ring-blue-500 ring-offset-1" : ""
      )}>
        <div className="flex h-full w-full items-center justify-center rounded-full overflow-hidden">
          <Image
            src={isUser ? "/assets/user_avatar.svg" : "/favicon/favicon.svg"}
            alt={isUser ? "User Avatar" : "AI Avatar"}
            width={16}
            height={16}
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
          "rounded-lg px-3 py-1.5 text-sm",
          isUser 
            ? "bg-blue-500 text-white" 
            : "bg-gray-100 text-gray-900"
        )}>
          {content}
        </div>
      </div>
    </div>
  )
}

