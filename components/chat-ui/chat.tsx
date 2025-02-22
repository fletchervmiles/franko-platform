"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Message } from "./message"
import { ChatInput } from "./input"
import { ConversationProgress } from "../conversation-progress"
import { updateChatInstanceProgress } from "@/db/queries/chat-instances-queries"
import type { ObjectiveProgress } from "@/db/schema/chat-instances-schema"
import { queryClient } from "@/components/providers"

interface ChatMessage {
  content: string
  isUser: boolean
  timestamp: string
}

interface ChatInputProps {
  onSend: (content: string) => void;
}

interface ChatProps {
  conversationId: string;
}

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

export function Chat({ conversationId }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      content: "Hello! How can I assist you today? 😊",
      isUser: false,
      timestamp: new Date().toISOString(),
    },
  ])
  const [inputValue, setInputValue] = useState("")

  const handleSendMessage = async (content: string) => {
    console.log('Sending message:', content);
    setMessages((prev) => [
      ...prev,
      {
        content,
        isUser: true,
        timestamp: new Date().toISOString(),
      },
    ]);

    // Initialize progress after first message exchange
    if (messages.length === 2) {
      const initialProgress: ObjectiveProgress = {
        objectives: {
          "obj1": { status: "current", comments: [] },
          "obj2": { status: "tbc", comments: [] },
          "obj3": { status: "tbc", comments: [] }
        }
      };
      
      await updateChatInstanceProgress(conversationId, initialProgress);
      // Invalidate after initial progress
      queryClient.invalidateQueries({ queryKey: ['objective-progress', conversationId] });
    }

    // Make API call to get AI response
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        conversationId,
      }),
    })
      .then(res => res.json())
      .then(aiMessage => {
        console.log('Received AI response:', aiMessage);
        setMessages(prev => [...prev, aiMessage]);
        // Invalidate after AI response to refresh progress
        queryClient.invalidateQueries({ queryKey: ['objective-progress', conversationId] });
      })
      .catch(error => {
        console.error('Error getting AI response:', error);
      });
  }

  return (
    <div className="h-full w-full flex">
      <Card className="flex-1 flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 py-8">
            {messages.map((message, index) => (
              <Message key={index} {...message} />
            ))}
          </div>
        </div>
        <ChatInput 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onSubmit={(e) => {
            e.preventDefault();
            if (inputValue.trim()) {
              handleSendMessage(inputValue);
              setInputValue("");
            }
          }}
        />
        <div 
          className={cn(
            "overflow-hidden transition-all duration-500 ease-in-out",
            messages.length > 1 ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="py-4">
            <ConversationProgress conversationId={conversationId} />
          </div>
        </div>
      </Card>
    </div>
  )
}

