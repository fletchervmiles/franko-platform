'use client'

import * as React from "react"
import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface FAQItem {
  question: string
  answer: string
}

interface FAQSectionProps {
  companyName: string
}

const faqItems = (companyName: string): FAQItem[] => [
  {
    question: "Is this a sales call?",
    answer: `Not at all! This is strictly a research interview to gather your valuable insights and improve ${companyName}'s product and services. No sales pitch or pressure to make a purchase.`
  },
  {
    question: "Who will I be speaking to?",
    answer: "You'll be speaking with an AI phone-based interviewer, designed to feel like a natural conversation. It will guide the interview and capture your feedback."
  },
  {
    question: "Why are you using AI?",
    answer: "With our AI interviewer, there's no need to schedule a time or wait - your interview begins instantly, and it's designed to capture your feedback smoothly and efficiently."
  },
  {
    question: "What kind of questions will I be asked?",
    answer: `We'll ask about your experience with ${companyName}, including your experience and suggestions for improvement. There are no right or wrong answers. We're just looking for your honest feedback.`
  },
  {
    question: "How long will the interview take?",
    answer: "The interview will last 5–7 minutes. You'll receive a call immediately after submitting your contact details."
  },
  {
    question: "How will my information be used?",
    answer: `Your responses will be used to improve ${companyName}'s products. This service is being conducted by Franko.ai. For more information, please see T&Cs and Privacy policy linked below.`
  }
]

export default function FAQSection({ companyName }: FAQSectionProps) {
  const faqs = React.useMemo(() => faqItems(companyName), [companyName])

  return (
    <Card className="w-full bg-white transition-all duration-300 ease-in-out p-2">
      <CardHeader className="pb-6">
        <CardTitle className="text-lg font-semibold">FAQs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="space-y-4">
            {faqs.map((item, index) => (
              <FAQItem key={index} question={item.question} answer={item.answer} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FAQItem({ question, answer }: FAQItem) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="border border-gray-200 rounded-md bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full p-4 text-left transition-all duration-300 ease-in-out"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold">{question}</span>
        <Plus className={`h-3 w-3 transition-transform ${isOpen ? "transform rotate-45" : ""}`} />
      </button>
      <div className={`px-4 overflow-hidden transition-all ${isOpen ? "max-h-96 pb-4" : "max-h-0"}`}>
        <p className="text-sm text-muted-foreground">{answer}</p>
      </div>
    </div>
  )
}