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
    question: "What is franko.ai in one sentence?",
    answer: "franko.ai is an always-on customer-feedback engine that interviews your users with AI, then turns every response into a live Product-Market-Fit score, quantified personas and individual response summaries."
  },
  {
    question: "How do AI interview agents work?",
    answer: "Pick a template (PMF, Churn, Acquisition) or start blank, click Generate and then share the link. The agent chats through 10-15 turns, explores customer experiences, and then stores the full transcript for you. Respondents just click a link, a new tab opens, and they chat just like they would with ChatGPT. No app, login or download."
  },
  {
    question: "How long does each interview take for customers?",
    answer: "Usually five to ten minutes. But this depends on the agent template and your specific configuration setup. For example, the churn agent can be completed in just a few minutes. But the product-market fit agent is close to 10 minutes. These details are specified when you create each agent instance."
  },
  {
    question: "What templates are available?",
    answer: "Product-Market Fit, Customer Churn, Customer Acquisition & Discovery or the option to fully custom a new agent."
  },
  {
    question: "Can I customize the agents?",
    answer: "Yes. After generation you can change each learning objective, including the desired outcome, turn count and agent guidance."
  },
  {
    question: "What is the PMF score and how is it calculated?",
    answer: "We ask \"How disappointed would you be if you could no longer use the product?\" and record the share who answer \"Very disappointed.\" Forty percent or higher indicates strong product-market fit."
  },
  {
    question: "What are quantified personas?",
    answer: "When you create an account, we'll generate 3-5 customer personas. After each customer response, the customer insight data will be assigned to a specific persona description. These personas show things like top benefits, top frictions, sentiment and sample quotes. Each persona type requires 5 responses to display initial data."
  },
  {
    question: "How does franko.ai fit with calls, surveys and analytics tools?",
    answer: "Think of feedback on a spectrum. 1. Calls: deep but low scale. 2. Franko: semi-structured, scalable \"why\" data. 3. Surveys like Typeform: structured scale testing specific hypotheses or NPS type data. 4. Analytics like Amplitude or PostHog: pure \"what\" behaviour. Great teams use all four. Franko fills the scalable qualitative gap."
  },
  {
    question: "What if customers do not respond?",
    answer: "Short chats, lifecycle timing and a small incentive lift completion rates by roughly thirty to forty percent over static forms. We provide a playbook for incentives and timing, just ask for it."
  },
  {
    question: "Can I offer incentives through Franko?",
    answer: "Yes. There's an option to automatically show a coupon code on the completion screen."
  },
  {
    question: "Can I integrate Franko with my stack?",
    answer: "Each agent can be linked to a webhook for triggered actions on your end."
  },
  {
    question: "What languages are supported?",
    answer: "Right now, just English."
  },
  {
    question: "Can I export raw data?",
    answer: "Yes."
  },
  {
    question: "Who owns the data?",
    answer: "You do. Franko acts only as a processor. Delete, export or anonymise data whenever you like."
  },
  {
    question: "Still have a question?",
    answer: "Email fletcher@franko.ai and I'll get back to you asap."
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

