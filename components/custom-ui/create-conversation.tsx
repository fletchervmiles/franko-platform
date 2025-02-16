"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus } from 'lucide-react'
import { useRouter } from "next/navigation"
import UserAvatar from "@/public/assets/user_avatar.svg"
import Image from "next/image"
import { createConversationAction } from "@/actions/conversations-actions"
import { useAuth } from "@clerk/nextjs"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

export default function CreateConversation() {
  const router = useRouter()
  const { userId } = useAuth()
  
  const onClick = async () => {
    if (!userId) return

    try {
      console.log('Creating conversation for user:', userId)
      // Create a new conversation
      const { status, data } = await createConversationAction({
        userId,
        messages: [],
      })

      console.log('Creation response:', { status, data })

      if (status === "success" && data) {
        // Redirect to the new conversation
        router.push(`/create-conversation/${data.id}`)
      }
    } catch (error) {
      console.error("Error creating conversation:", error)
    }
  }

  return (
    <div className="w-full h-full p-4">
      <Card 
        className="w-full h-full cursor-pointer transition-all hover:shadow-md flex flex-col items-center justify-center bg-white gap-4 rounded-lg"
        onClick={onClick}
      >
        {/* Option 1: Light grey background with dark grey icon */}
        <Image 
          src={UserAvatar}
          alt="User Avatar"
          width={56}
          height={56}
          className="text-gray-600"
        />

        {/* Option 2: Dark grey background with light grey icon */}
        {/* <div className="rounded-full bg-gray-700 p-8">
          <Sparkles className="w-16 h-16 text-gray-200" />
        </div> */}

        {/* Option 3: Very light grey background with black icon */}
        {/* <div className="rounded-full bg-gray-50 p-8">
          <Sparkles className="w-16 h-16 text-black" />
        </div> */}

        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-xl font-semibold text-gray-900">
            No conversations yet.
          </h2>
          <p className="text-sm text-gray-500">
            Let's get started! Begin a quick and simple chat to create a personalized conversational AI to share with your customers.
          </p>
        </div>
        <Button 
          className="bg-[#0070f3] hover:bg-[#0060d3] text-white mt-4"
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Conversation
        </Button>
      </Card>
    </div>
  )
}



