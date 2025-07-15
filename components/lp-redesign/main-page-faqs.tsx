'use client'

import * as React from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Container from "@/components/lp-redesign/container"

interface FAQItem {
  question: string
  answer: string | React.ReactNode
}

const faqItems: FAQItem[] = [
  {
    question: "How is this different from pop-up survey tools like Sprig or Hotjar?",
    answer: "Humans communicate through conversations, not multiple choice.\n\nSurveys are good for testing a specific hypothesis, i.e. \"Do you prefer feature X or feature Y?\" But they don't tell you why, only what.\n\nThink about NPS. Yes, it gives you a sense of customer satisfaction. But it only tells you a number, not why the customer gave the specific answer. It's mostly a vanity metric.\n\nOur agents have short conversations. They react to what your customers say and then seek to understand the why behind their statements over multiple back and forths."
  },
  {
    question: "How do I install Franko?",
    answer: "After creating your account and first modal, head over to the \"Connect\" tab. There you'll find thorough instructions along with helpful documentation links to guide you. Installation is quick, straightforward, and will only take a few minutes."
  },
  {
    question: "Can I only have the modal appear on certain pages?",
    answer: "Yes. The modal installation process is very flexible. You can find the documentation here."
  },
  {
    question: "Can I customize my feedback modal?",
    answer: "Yes, the modal is fully customizable to your branding."
  },
  {
    question: "Which interview agents appear on my modal?",
    answer: "Currently you can select up to six agents, with more to be added. The agents are as follows:\n\nAgent: Key Benefit\nPurpose: Find your products's strongest selling points and why those matter to your users.\n\nAgent: Improvements & Friction\nPurpose: Pinpoint your products's biggest friction points to proactively reduce churn.\n\nAgent: Upgrade Objections\nPurpose: Discover what's preventing paid upgrades, so you can fix your conversion funnel.\n\nAgent: Persona + Problem\nPurpose: Identify your ideal customers, their roles, and the core problems your product solves.\n\nAgent: Discovery Trigger\nPurpose: Learn where users find your product and what catches their interest.\n\nAgent: Feature Wishlist\nPurpose: Surface feature requests and understand the user needs driving them."
  }
]

export function MainPageFAQs() {
  // Function to render text with formatting
  const renderAnswer = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.trim() === '') {
        return <div key={index} className="h-4" />
      }
      
      // Handle lines that start with "Agent:" or "Purpose:"
      if (line.startsWith('Agent:')) {
        return (
          <p key={index} className="mb-2 font-medium text-sm" style={{ color: '#0c0a09' }}>
            {line}
          </p>
        )
      }
      
      if (line.startsWith('Purpose:')) {
        return (
          <p key={index} className="mb-4 text-xs" style={{ color: '#0c0a0999' }}>
            {line}
          </p>
        )
      }
      
      // Regular paragraph
      return (
        <p key={index} className="mb-3 leading-relaxed text-sm" style={{ color: '#0c0a0999' }}>
          {line}
        </p>
      )
    })
  }

  return (
    <div className="py-20 bg-white">
      <Container>
        <div className="text-center mb-16">
          {/* Main heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-normal mb-6 leading-tight" style={{ color: '#0c0a09' }}>
            FAQ
          </h2>
        </div>
        
        <div className="w-full border-t border-gray-200">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-left text-sm hover:no-underline font-medium px-6 leading-tight" style={{ color: '#0c0a09' }}>
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm pb-5 px-6">
                  <div className="pt-2">
                    {typeof item.answer === 'string' ? renderAnswer(item.answer) : item.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </div>
  )
} 