import { Avatar } from "@/components/ui/avatar"
import Image from "next/image"

interface MessageProps {
  content: string
  isUser?: boolean
  timestamp?: string
}

export function Message({ content, isUser = false, timestamp }: MessageProps) {
  return (
    <div className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""} px-4 md:px-8 w-full max-w-3xl mx-auto`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <div className="flex h-full w-full items-center justify-center rounded-full overflow-hidden">
          <Image
            src={isUser ? "/assets/user_avatar.svg" : "/favicon/favicon.svg"}
            alt={isUser ? "User Avatar" : "AI Avatar"}
            width={32}
            height={32}
          />
        </div>
      </Avatar>
      <div
        className={`flex flex-col gap-1 ${
          isUser ? "items-end" : "items-start"
        } flex-1`}
      >
        <div className="text-sm text-gray-500">{timestamp}</div>
        <div className="text-sm">{content}</div>
      </div>
    </div>
  )
}

