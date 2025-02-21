"use client"

import { cn } from "@/lib/utils"
import { ChatInput } from "./input"
import { 
  Users, 
  Target, 
  BarChart2, 
  UserPlus, 
  MessageSquare, 
  DollarSign 
} from "lucide-react"
import { useRef } from "react"

interface Topic {
  title: string
  prompt: string
  icon: React.ComponentType<{ className?: string }>
}

const topics: Topic[] = [
  {
    title: "Customer Churn",
    prompt: "Help me analyze our customer churn patterns and identify the key factors causing customers to leave",
    icon: Users
  },
  {
    title: "Product-Market Fit",
    prompt: "Help me evaluate our product-market fit and understand how well we're meeting our customers' needs",
    icon: Target
  },
  {
    title: "Net-Promotor-Score (NPS)",
    prompt: "Help me analyze our NPS feedback to understand customer satisfaction and areas for improvement",
    icon: BarChart2
  },
  {
    title: "Onboarding Experience",
    prompt: "Help me assess our customer onboarding experience and identify opportunities to enhance it",
    icon: UserPlus
  },
  {
    title: "Sales Meeting Feedback",
    prompt: "Help me analyze our sales meeting feedback to improve our sales process and conversion rates",
    icon: MessageSquare
  },
  {
    title: "Pricing Analysis",
    prompt: "Help me evaluate our pricing strategy and understand how it aligns with customer value perception",
    icon: DollarSign
  }
]

interface TopicGridProps {
  onTopicSelect: (prompt: string) => void
  input: string
  setInput: (value: string) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}

export function TopicGrid({ 
  onTopicSelect, 
  input, 
  setInput, 
  handleSubmit, 
  isLoading 
}: TopicGridProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleTopicClick = (prompt: string) => {
    // Just set the input value and focus
    setInput(prompt)
    inputRef.current?.focus()
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-3xl px-4 space-y-8">
        <h1 className="text-3xl font-semibold text-center">
          What would you like to learn from your customers?
        </h1>
        
        <div className="w-full">
          <ChatInput
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onSubmit={(e) => {
              handleSubmit(e)
              onTopicSelect(input) // Only trigger state change on actual submission
            }}
            disabled={isLoading}
            showProgressBar={false}
            steps={[]}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {topics.map((topic) => (
            <button
              key={topic.title}
              onClick={() => handleTopicClick(topic.prompt)}
              className={cn(
                "p-4 rounded-lg border border-gray-200 bg-white",
                "hover:bg-gray-50 transition-colors duration-200",
                "text-left flex items-center gap-3",
                "focus:outline-none focus:ring-1 focus:ring-gray-200",
                "shadow-[0_0_1px_rgba(0,0,0,0.05)]",
                "group"
              )}
            >
              <topic.icon className="h-4 w-4 text-[#0070f3]/70 flex-shrink-0 transition-colors group-hover:text-[#0070f3]" />
              <h3 className="text-sm text-gray-700">{topic.title}</h3>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 