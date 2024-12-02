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
    question: "How does the interview agent work?",
    answer: "Our agent is designed to conduct exploratory, narrative-driven interviews focused on understanding customer churn. It uses advanced interviewing techniques to engage customers in open, meaningful conversations. The agent is contextualized to your business, ensuring that each interview is centered on your specific needs."
  },
  {
    question: "How long does each interview last?",
    answer: "Each interview will go for approximately 5-7 minutes."
  },
  {
    question: "What kind of insights can I expect from the per-interview analysis?",
    answer: "Each interview comes with an analysis that includes: reasons for cancellation or potential cancellation, unmet expectations, areas for product/service improvement, customer suggestions, identification of win-back opportunities, and recommended next steps to reduce churn."
  },
  {
    question: "Are customer incentives included in the plans?",
    answer: "No, customer interview incentives are not included in the plans. You'll need to offer incentives to encourage customer participation."
  },
  {
    question: "How do I invite customers to participate in interviews?",
    answer: "In the setup tab of the dashboard, you'll find a unique URL that you can share with your customers via email or wherever is best. This link directs them to a very short form where they can initiate the phone call."
  },
  {
    question: "Can I customize the interview questions or focus areas?",
    answer: "Not right now, but that is on our roadmap. If you've got a use case you want to get started on ASAP, please email fletcher@franko.ai."
  },
  {
    question: "Is there a contract or commitment period for the plans?",
    answer: "No, this is a SaaS product. You can cancel your monthly plan at any time."
  },
  {
    question: "Do you offer support if I have questions or need assistance?",
    answer: "Yes, please email fletcher@franko.ai for support, and we'll get back to you ASAP. A phone number is also available within the contact section of your dashboard."
  },
  {
    question: "What is your refund policy?",
    answer: "We want you to be completely satisfied with our service. If for any reason you're not happy, you can email fletcher@franko.ai to process a refund. Refund requests should be made during the same billing month in which you signed up or soon after."
  }
]

export function FAQSection({ companyName }: FAQSectionProps) {
  const faqs = React.useMemo(() => faqItems(companyName), [companyName])

  return (
    <Card className="w-full bg-white transition-all duration-300 ease-in-out p-2 shadow-none">
      <CardHeader className="pb-6">
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black border border-gray-200 shadow-sm">
            FAQs
          </span>
        </div>
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

