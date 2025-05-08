'use client'

import * as React from "react"
import { Plus } from 'lucide-react'
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
    question: "How does the conversation agent work?",
    answer: "Our agents are designed to conduct exploratory, narrative-driven interviews focused on diving deep with your customers. It uses advanced interviewing techniques to engage customers in open, meaningful conversations. The agent is contextualized to your business, plus the Conversation Plan you'll create when setting up a new Conversation, ensuring that each customer conversation is centered on your specific needs."
  },
  {
    question: "How long does each conversation last?",
    answer: "When you create a new Conversation Plan, you'll have the option to select your desired duration, usually between 1 and 10 minutes."
  },
  {
    question: "How do I invite customers to participate in interviews?",
    answer: "In the Share tab of each Conversation Plan, you'll find a unique URL that you can share with your customers via email. Similar to sending out a survey."
  },
  {
    question: "Can I customize the interview questions or focus areas?",
    answer: "Yes, you can! When you generate a new Conversation Plan, we will create an initial plan based on your inputs. Once it's been generated, you're free to edit it as much as you like."
  },
  {
    question: "Is there a contract or commitment period for the plans?",
    answer: "No, this is a SaaS product. You can cancel your monthly plan at any time."
  },
  {
    question: "Do you offer support if I have questions or need assistance?",
    answer: "Yes, please email fletcher@franko.ai for support, and I'll get back to you ASAP.."
  },
  {
    question: "What is your refund policy?",
    answer: "We want you to be completely satisfied with our service. If for any reason you're not happy, you can email fletcher@franko.ai to process a refund. Refund requests should be made during the same billing month in which you signed up or soon after."
  }
]


export function FAQSection({ companyName }: FAQSectionProps) {
  const faqs = React.useMemo(() => faqItems(companyName), [companyName])

  return (
    <Card className="w-full bg-white transition-all duration-300 ease-in-out p-2 shadow-none border-0">
      <CardHeader className="pb-6">
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black border border-gray-200 shadow-sm">
            FAQs
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-center mb-6">
          Questions? Answers.
        </h2>
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

