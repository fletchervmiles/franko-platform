"use client"

import Container from "./container"
import { MessageSquare, BarChart2, Users, Search, Layers, LinkIcon } from "lucide-react"

const benefits = [
  {
    title: "AI USER INTERVIEWS",
    description:
      "Agents trained on your data to conduct short chat-based user interviews.",
    icon: <MessageSquare className="h-5 w-5 text-[#0C0A08]" />,
  },
  {
    title: "MULTI-MODALS",
    description:
      "Configure modals to display relevant interview agents based on the customer journey stage.",
    icon: <Layers className="h-5 w-5 text-[#0C0A08]" />,
  },
  {
    title: "ANALYSIS IN YOUR EMAIL",
    description:
      "Receive interview analysis directly in your inbox, helping to keep customers top-of-mind.",
    icon: <BarChart2 className="h-5 w-5 text-[#0C0A08]" />,
  },
  {
    title: "CHAT OR DOWNLOAD DATA",
    description:
      "Chat directly with your customer response data or download an LLM-ready (or csv) file.",
    icon: <Search className="h-5 w-5 text-[#0C0A08]" />,
  },
  {
    title: "CUSTOMER REPORTS",
    description:
      "Receive weekly in-depth customer research reports. Exactly what you'd expect from a dedicated research team.",
    icon: <Users className="h-5 w-5 text-[#0C0A08]" />,
    comingSoon: true,
  },
  {
    title: "EMBED / SHAREABLE LINKS",
    description:
      "Embed modals in your UI or share standalone links, engaging customers when it's convenient for them.",
    icon: <LinkIcon className="h-5 w-5 text-[#0C0A08]" />,
  },
]

export default function BenefitsSection() {
  return (
    <section className="py-24 bg-white">
      <Container>
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-normal mb-6 leading-tight text-black">
          Always-on customer discovery
          </h1>
          <h2 className="text-lg md:text-xl text-gray-700 leading-relaxed">
            Built for early-stage product founders obsessed with understanding customers.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white p-8 border border-gray-100 flex flex-col">
              <div className="mb-4">
                <div className="w-10 h-10 bg-[#E4EBF6] rounded-lg flex items-center justify-center">
                  {benefit.icon}
                </div>
              </div>
              <h3 className="text-sm font-bold mb-3 tracking-wide">
                {benefit.title}
                {benefit.comingSoon && (
                  <span className="ml-2 text-xs text-gray-500 font-normal">(coming soon)</span>
                )}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
