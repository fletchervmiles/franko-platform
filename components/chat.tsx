"use client"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Message } from "./message"
import { ChatInput } from "./input"
import { ProgressBar, type Step } from "./progress-bar"

interface ChatMessage {
  content: string
  isUser: boolean
}

interface ChatProps {
  conversationId: string
}

const initialSteps: Step[] = [
  { label: "Intro", status: "in-review" },
  { label: "Discovery", status: "pending" },
  { label: "Review", status: "pending" },
  { label: "Finish", status: "pending" },
]

export function Chat({ conversationId }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      content: "Hello! How can I assist you today? 😊",
      isUser: false,
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [showProgressBar, setShowProgressBar] = useState(false)
  const [steps, setSteps] = useState(initialSteps)

  useEffect(() => {
    if (messages.length > 1 && !showProgressBar) {
      setShowProgressBar(true)
    }
  }, [messages, showProgressBar])

  const handleSendMessage = (content: string) => {
    console.log("Sending message:", content)
    setMessages((prev) => [
      ...prev,
      {
        content,
        isUser: true,
      },
    ])

    // Simulate AI response (remove this when implementing actual API call)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          content: "This is a simulated AI response.",
          isUser: false,
        },
      ])
    }, 1000)

    // Simulate progress after user sends a message
    if (steps[0].status === "in-review") {
      setTimeout(() => {
        setSteps((prevSteps) => [
          { ...prevSteps[0], status: "completed" },
          { ...prevSteps[1], status: "in-review" },
          ...prevSteps.slice(2),
        ])
      }, 1000)
    }
  }

  return (
    <div className="h-full w-full flex flex-col bg-white">
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
          e.preventDefault()
          if (inputValue.trim()) {
            handleSendMessage(inputValue)
            setInputValue("")
          }
        }}
        disabled={false}
      />
      <div
        className={cn(
          "overflow-hidden transition-all duration-500 ease-in-out",
          showProgressBar ? "max-h-24 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <ProgressBar steps={steps} />
      </div>
    </div>
  )
}

