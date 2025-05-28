'use client'

import * as React from "react"
import { Plus } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: "What if customers don't respond?",
    answer: "Short, asynchronous, guided questions plus zero scheduling friction = more replies.\n\nFranko's conversational UI lifts completion by roughly 30–40 percent over traditional forms. It makes things easier for the customer vs a call or a generic feedback request.\n\nHowever, many of the interviews (depending on configuration) can take 5-10 minutes, so a small incentive is encouraged to boost response rates.\n\nNeed help with this? Email us and we'll send our quick incentive playbook."
  },
  {
    question: "How does this help me grow product-market fit?",
    answer: "Continuous feedback fuels growth. ProfitWell's 4,000-company study shows teams that keep interviewing customers grow ARR 2-3x faster over three years.\n\nFranko's interview agents handle the whole loop: they ask the right questions, dig into understanding the \"why\", identify high signal data, and cluster personas automatically.\n\nWith that data you can ship the right features, fix friction and focus acquisition on the segments more likely to convert."
  },
  {
    question: "My product is pretty technical, will the agent get it?",
    answer: "Absolutely. When you set up Franko, you create rich context on your business, product, and brand voice, ensuring your agents have the right context.\n\nHowever, the primary focus of the agent isn't your product's details. The agents are trained to understand your customer's perspectives and experiences, with a focus on active listening and root cause exploration."
  },
  {
    question: "Can I customize the agents / questions?",
    answer: "Yes. Two quick steps:\n\n**Generate** an agent from a template or a custom setup.\n\nYou'll be redirected to the interview plan where you can **edit** the step-by-step learning objectives, desired outcomes and agent guidance.\n\nNote, the agent focuses on \"learning outcomes\" rather than specific questions. However, you can include specific questions in the agent guidance instructions."
  },
  {
    question: "Shouldn't I personally interact with customers instead of using automated agents?",
    answer: "Yes, direct customer conversations are essential.\n\nBut the best teams use a multi-channel approach:\n\n• **Human-led interviews** (deeply exploratory, unstructured but limited scale)\n• **Franko's automated interviews** (fully scalable, semi-structured around key topics like discovery, benefits, churn, etc.)\n• **Traditional surveys** (less exploratory, good for quantitative scale testing or multiple choice, i.e. NPS)\n• **Product analytics** (quantitative insight on what users do, but not why)\n\nFranko captures rich, semi-structured conversational insights continuously and at scale. This should complement your personal calls, informing where to focus, and deepening your overall understanding of customers."
  },
  {
    question: "How is this different from Typeform, Amplitude or PostHog?",
    answer: "Franko sits uniquely between open-ended discovery interviews and fully structured analytics.\n\nThink of customer feedback on a spectrum:\n\n• **Human-led calls** (exploratory, qualitative, low-scale, unstructured)\n• **Franko** (semi-structured, scalable, rich qualitative insights)\n  — Semi structured and scalable = you can repeat the same five to ten minute interview, built around five clear learning objectives, thousands of times without extra effort.\n• **Typeform-style surveys** (good if you have a qualitative insight you want to test with scale)\n• **Amplitude/PostHog** (quantitative behavior analytics, tells you what but not why)\n\nAnalytics show you what's happening; structured surveys quantify specific hypotheses. Franko agents deliver clear insights into how your customers articulate their challenges, desires, and what exactly they value in your product — data that's critical for deepening product-market fit."
  }
]

export function MainPageFAQs() {
  return (
    <section className="bg-gray-50 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center px-6 py-2 mb-8 bg-white border border-gray-200 shadow-sm">
            <span className="text-black font-medium text-sm flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              FAQs
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 mb-4">
            Common questions
          </h2>
        </div>
        
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <FAQItem key={index} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQItem({ question, answer }: FAQItem) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Function to render text with markdown-like formatting
  const renderAnswer = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.trim() === '') {
        return <div key={index} className="h-3" />
      }
      
      // Handle bold text
      if (line.includes('**')) {
        const parts = line.split('**')
        return (
          <p key={index} className="mb-3">
            {parts.map((part, partIndex) => 
              partIndex % 2 === 1 ? <strong key={partIndex}>{part}</strong> : part
            )}
          </p>
        )
      }
      
      // Handle sub-bullets (lines that start with spaces and dash)
      if (line.match(/^\s+—/)) {
        return (
          <div key={index} className="flex items-start mb-2 ml-6">
            <span className="text-gray-400 mr-3 mt-0.5 flex-shrink-0">—</span>
            <span className="text-gray-600 italic text-xs leading-relaxed">
              {line.replace(/^\s+—\s*/, '')}
            </span>
          </div>
        )
      }
      
      // Handle main bullet points
      if (line.trim().startsWith('•')) {
        const content = line.replace(/^\s*•\s*/, '')
        const parts = content.split('**')
        
        return (
          <div key={index} className="flex items-start mb-2">
            <span className="text-gray-400 mr-3 mt-0.5 flex-shrink-0">•</span>
            <span className="text-gray-800 leading-relaxed">
              {parts.map((part, partIndex) => 
                partIndex % 2 === 1 ? <strong key={partIndex}>{part}</strong> : part
              )}
            </span>
          </div>
        )
      }
      
      // Regular paragraph
      return <p key={index} className="mb-3 leading-relaxed">{line}</p>
    })
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full p-6 text-left transition-all duration-200 ease-in-out"
        aria-expanded={isOpen}
      >
        <span className="text-base font-semibold text-gray-900 pr-4">{question}</span>
        <Plus className={`h-5 w-5 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? "transform rotate-45" : ""}`} />
      </button>
      <div className={`px-6 overflow-hidden transition-all duration-200 ${isOpen ? "max-h-[1000px] pb-6" : "max-h-0"}`}>
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <div className="text-sm text-gray-800 leading-relaxed">
            {renderAnswer(answer)}
          </div>
        </div>
      </div>
    </div>
  )
} 