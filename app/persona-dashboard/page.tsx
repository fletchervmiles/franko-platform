"use client"

import { useState } from "react"
import { NavSidebar } from "@/components/nav-sidebar"
import { PersonaTopBarOption6 } from "@/components/persona-dashboard/persona-top-card"
import { PersonaCard } from "@/components/persona-dashboard/persona-section-card"

// Define updated persona snapshots
const personaSnapshots = [
  {
    personaId: "solo-developer",
    personaLabel: "Solo Developer",
    pmfVeryPct: 32,
    sentiment: { positive: 24, neutral: 10, negative: 8 },
    sampleSize: 42,
    confidence: "Moderate",
    summary: "technical efficiency-focused",
  },
  {
    personaId: "startup-cto",
    personaLabel: "Startup CTO / Founder",
    pmfVeryPct: 45,
    sentiment: { positive: 30, neutral: 8, negative: 5 },
    sampleSize: 43,
    confidence: "Moderate",
    summary: "budget-tight time-strapped",
  },
  {
    personaId: "enterprise-engineer",
    personaLabel: "Enterprise Engineer",
    pmfVeryPct: 8,
    sentiment: { positive: 10, neutral: 15, negative: 20 },
    sampleSize: 45,
    confidence: "Moderate",
    summary: "security-focused team-based",
  },
  {
    personaId: "coding-student",
    personaLabel: "Coding Student",
    pmfVeryPct: 18,
    sentiment: { positive: 15, neutral: 20, negative: 10 },
    sampleSize: 45,
    confidence: "Low",
    summary: "budget-tight technical",
  },
  {
    personaId: "product-manager",
    personaLabel: "Product Manager",
    pmfVeryPct: 22,
    sentiment: { positive: 18, neutral: 12, negative: 15 },
    sampleSize: 45,
    confidence: "Moderate",
    summary: "non-technical visual-oriented",
  },
  {
    personaId: "very-disappointed",
    personaLabel: "Very Disappointed Users",
    pmfVeryPct: 100,
    sentiment: { positive: 5, neutral: 5, negative: 40 },
    sampleSize: 50,
    confidence: "High",
    summary: "budget-tight time-strapped",
  },
  {
    personaId: "somewhat-disappointed",
    personaLabel: "Somewhat Disappointed Users",
    pmfVeryPct: 0,
    sentiment: { positive: 10, neutral: 30, negative: 20 },
    sampleSize: 60,
    confidence: "High",
    summary: "technical efficiency-focused",
  },
  {
    personaId: "not-disappointed",
    personaLabel: "Not Disappointed Users",
    pmfVeryPct: 0,
    sentiment: { positive: 35, neutral: 15, negative: 5 },
    sampleSize: 55,
    confidence: "High",
    summary: "non-technical visual-oriented",
  },
]

export default function SnapshotPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLoadingClick = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <NavSidebar>
      <div className="p-4 md:p-8 lg:p-12">
        <div className="space-y-8">
          <PersonaTopBarOption6 snapshots={personaSnapshots} />
          <PersonaCard isLoading={isLoading} />
        </div>
      </div>
    </NavSidebar>
  )
}
