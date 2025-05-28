"use client"

import Container from "./container"
import { MessageSquare, BarChart2, Users, Search, Layers, LinkIcon } from "lucide-react"

const benefits = [
  {
    title: "AI INTERVIEW AGENTS",
    description:
      "AI agents run configurable, exploratory, chat-based interviews asynchronously, capturing high-signal insights at scale with zero research-team overhead.",
    icon: <MessageSquare className="h-6 w-6 text-blue-600" />,
  },
  {
    title: "TRACK PMF",
    description:
      "Automatically track Product-Market Fit by measuring how many users would be disappointed without your product and most importantly, understand why! An essential growth indicator.",
    icon: <BarChart2 className="h-6 w-6 text-blue-600" />,
  },
  {
    title: "QUANTIFIED PERSONAS",
    description:
      "Automatically segment customer responses into quantified personas, revealing who they are, how they discovered you, why they love your product, improvement opportunities, and more.",
    icon: <Users className="h-6 w-6 text-blue-600" />,
  },
  {
    title: "CHAT WITH YOUR RESPONSE DATA",
    description:
      'Use your data to ask any question - "What customer type love us the most and why?" Get answers based on 1,000s of interview transcripts.',
    icon: <Search className="h-6 w-6 text-blue-600" />,
  },
  {
    title: "CONTINUOUS MULTI-AGENT INTERVIEWERS",
    description:
      "Deploy AI agents across channels with agents for pmf, acquisition + discovery, churn, pricing, feature preference and more, capturing semi-structured insights across the customer journey.",
    icon: <Layers className="h-6 w-6 text-blue-600" />,
  },
  {
    title: "SHAREABLE LINKS & ALERTS",
    description:
      "Use agent links in emails, banners, or DMs, with response notifications, completion redirects, webhooks, and optional built-in incentives.",
    icon: <LinkIcon className="h-6 w-6 text-blue-600" />,
  },
]

export default function BenefitsSection() {
  return (
    <section className="py-24 grid-background03">
      <Container>
        <div className="max-w-4xl mx-auto text-center mb-16">
          {/* "End-To-End" bubble */}
          <div className="inline-flex items-center justify-center px-6 py-2 mb-8 bg-white border border-gray-200 shadow-sm">
            <span className="text-black font-medium text-sm flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              End-To-End
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-normal mb-6 leading-tight text-black">
            Your Always-On Product-Market Fit Engine
          </h1>
          <h2 className="text-lg md:text-xl text-gray-700 leading-relaxed">
          Built for early-stage product founders finding and deepening product-market fit; a research-team-in-a-box.
        </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white p-8 border border-gray-100 flex flex-col">
              <div className="mb-4">{benefit.icon}</div>
              <h3 className="text-sm font-bold mb-3 tracking-wide">{benefit.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
