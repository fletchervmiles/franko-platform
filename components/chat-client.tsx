"use client"

import { useChat, type Message } from "ai/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

type Props = {
  conversationId: string
  initialMessages: Message[]
}

export default function ChatClient({ conversationId, initialMessages }: Props) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } = useChat({
    id: conversationId,
    initialMessages,
    // Commenting out the API reference as requested
    // api: "/api/chat",
  })

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto p-4 space-y-4">
      <Card className="flex-grow relative">
        <ScrollArea className="h-full absolute inset-0 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          placeholder="Type a message..."
          onChange={handleInputChange}
          disabled={isLoading}
          className="flex-grow"
        />
        {isLoading ? (
          <Button type="button" variant="outline" onClick={stop}>
            Stop
          </Button>
        ) : (
          <Button type="submit" disabled={!input.trim()}>
            Send
          </Button>
        )}
      </form>
    </div>
  )
}

