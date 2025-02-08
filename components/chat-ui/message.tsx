import { Avatar } from "@/components/ui/avatar"
import Image from "next/image"

interface MessageProps {
  content: string
  isUser?: boolean
  timestamp?: string
}

export function Message({ content, isUser = false, timestamp }: MessageProps) {
  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''} px-4 md:px-8 w-full max-w-3xl mx-auto`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <div className="flex h-full w-full items-center justify-center rounded-full overflow-hidden">
          <Image
            src={isUser ? "/assets/user_avatar.svg" : "/favicon/favicon.svg"}
            alt={isUser ? "User Avatar" : "AI Avatar"}
            width={24}
            height={24}
            className="h-6 w-6 object-cover"
          />
        </div>
      </Avatar>
      <div className={`flex flex-col gap-2 flex-grow ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser ? 'bg-gray-100' : 'bg-white'
          }`}
        >
          <p className={`${isUser ? 'text-sm' : 'text-base'} text-gray-900`}>{content}</p>
        </div>
      </div>
    </div>
  )
}

