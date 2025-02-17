"use client"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      content: "Hello! How can I assist you today? 😊",
      isUser: false,
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [showProgressBar, setShowProgressBar] = useState(false)
  const [steps, setSteps] = useState(initialSteps)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, showProgressBar]) // Scroll on new messages or progress bar changes

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
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl space-y-6 py-8">
          {messages.map((message, index) => (
            <Message key={index} {...message} />
          ))}
          <div ref={messagesEndRef} className="h-px" />
        </div>
      </div>
      
      <div className="flex-none w-full bg-white">
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
          showProgressBar={showProgressBar}
          steps={steps}
        />
      </div>
    </div>
  )
}

