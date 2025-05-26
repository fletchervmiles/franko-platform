"use client"

import { useState } from "react"
import { Info, Check, ChevronsUpDown } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

// Define PersonaSnapshot type directly
export interface PersonaSnapshot {
  personaId: string;
  personaLabel: string;
  pmfVeryPct: number;
  sentiment: { positive: number; neutral: number; negative: number };
  sampleSize: number;
  confidence: string;
  summary: string;
}

// Define default persona options if none are provided
const defaultPersonas: PersonaSnapshot[] = [
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
]

interface PersonaTopBarOption6Props {
  snapshots?: PersonaSnapshot[]
  initialPersonaId?: string
}

export function PersonaTopBarOption6({ snapshots = defaultPersonas, initialPersonaId }: PersonaTopBarOption6Props) {
  const [selectedPersonaId, setSelectedPersonaId] = useState(initialPersonaId || snapshots[0]?.personaId)

  const selectedSnapshot = snapshots.find((s) => s.personaId === selectedPersonaId) || snapshots[0]

  if (!selectedSnapshot) {
    return <div className="p-4 text-gray-500">No persona data available</div>
  }

  const handlePersonaChange = (personaId: string) => {
    setSelectedPersonaId(personaId)
  }

  // Fixed traits instead of dynamic ones
  const traits = ["Risk tolerant", "Shipping-focused", "Hands-on builders"]

  // Determine PMF status label and color
  const getPmfStatus = (score: number) => {
    if (score >= 40) return { label: "Strong", color: "text-green-600" }
    if (score >= 25) return { label: "Emerging", color: "text-blue-600" }
    if (score >= 10) return { label: "Needs Work", color: "text-amber-600" }
    return { label: "Pre-PMF", color: "text-red-600" }
  }

  const pmfStatus = getPmfStatus(selectedSnapshot.pmfVeryPct)

  // Calculate sentiment percentages and NSI
  const { positive, neutral, negative } = selectedSnapshot.sentiment
  const total = positive + negative // Exclude neutral for NSI calculation
  const positivePct = total > 0 ? Math.round((positive / total) * 100) : 0
  const negativePct = total > 0 ? Math.round((negative / total) * 100) : 0
  const nsi = positivePct - negativePct

  // Determine sentiment label and color based on NSI thresholds
  let sentimentLabel, sentimentColor
  if (nsi >= 35) {
    sentimentLabel = "Upbeat"
    sentimentColor = "text-green-600"
  } else if (nsi >= 10) {
    sentimentLabel = "Positive"
    sentimentColor = "text-green-600"
  } else if (nsi >= -9) {
    sentimentLabel = "Mixed"
    sentimentColor = "text-gray-600"
  } else if (nsi >= -34) {
    sentimentLabel = "Concerned"
    sentimentColor = "text-amber-600"
  } else {
    sentimentLabel = "Frustrated"
    sentimentColor = "text-red-600"
  }

  // Get confidence color
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "Very Low":
        return "text-red-600"
      case "Low":
        return "text-amber-600"
      case "Moderate":
        return "text-blue-600"
      case "High":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  const confidenceColor = getConfidenceColor(selectedSnapshot.confidence)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm p-4">
      {/* Header with persona name and traits */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{selectedSnapshot.personaLabel}</h3>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-fit justify-between">
                Select Persona
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Search personas..." />
                <CommandList>
                  <CommandEmpty>No persona found.</CommandEmpty>
                  <CommandGroup>
                    {snapshots.map((persona) => (
                      <CommandItem
                        key={persona.personaId}
                        value={persona.personaId}
                        onSelect={() => handlePersonaChange(persona.personaId)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedPersonaId === persona.personaId ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {persona.personaLabel}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-wrap gap-2">
          {traits.map((trait, index) => (
            <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
              {trait}
            </span>
          ))}
        </div>
      </div>

      {/* Metrics strip */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center border-b">
        <div className="grid grid-cols-2 md:grid-cols-4 w-full gap-4 md:gap-0">
          {/* PMF Metric */}
          <div className="md:border-r border-gray-200 pr-0 md:pr-4">
            <div className="flex items-center gap-1 h-6">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">PMF</span>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px]">
                    <div className="space-y-2">
                      <p className="font-medium">Product-Market Fit Score</p>
                      <p className="text-sm">
                        {selectedSnapshot.pmfVeryPct}% of users would be "very disappointed" if they could no longer use
                        the product.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-base font-semibold">{selectedSnapshot.pmfVeryPct}%</span>
              <span className={`text-sm ${pmfStatus.color}`}>• {pmfStatus.label}</span>
            </div>
          </div>

          {/* Sentiment Metric */}
          <div className="md:border-r border-gray-200 px-0 md:px-4">
            <div className="flex items-center gap-1 h-6">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Sentiment</span>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[380px]">
                    <div className="space-y-3">
                      <p className="font-medium">Net Sentiment Index</p>

                      <div>
                        <p className="font-medium text-sm">How it's calculated</p>
                        <p className="text-sm">( # positive quotes – # negative quotes ) ÷ total quotes × 100</p>
                        <p className="text-sm">
                          The score therefore ranges from –100 (all negative) to +100 (all positive). Neutral quotes are
                          counted in the denominator but add zero to the numerator, so they dilute extremes.
                        </p>
                      </div>

                      <div>
                        <p className="font-medium text-sm">Reading the score</p>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-start">
                            <span className="mr-1.5">•</span>
                            <span>+40 or higher Clear positivity</span>
                          </li>
                          <li className="flex items-start">
                            <span className="mr-1.5">•</span>
                            <span>-40 or lower Significant discontent</span>
                          </li>
                          <li className="flex items-start">
                            <span className="mr-1.5">•</span>
                            <span>-10 to +10 Mixed / undecided</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-base font-semibold text-gray-900">{nsi > 0 ? `+${nsi}` : nsi}</span>
              <span className={`text-sm ${sentimentColor}`}>• {sentimentLabel}</span>
            </div>
          </div>

          {/* Sample Size */}
          <div className="md:border-r border-gray-200 px-0 md:px-4">
            <div className="flex items-center gap-1 h-6">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Responses</span>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Number of interviews analyzed</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="mt-1">
              <span className="text-base font-semibold">{selectedSnapshot.sampleSize}</span>
            </div>
          </div>

          {/* Confidence */}
          <div className="pl-0 md:pl-4">
            <div className="flex items-center gap-1 h-6">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Confidence</span>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[320px]">
                    <div className="space-y-3">
                      <p className="font-medium">Confidence is a quick proxy for data reliability:</p>
                      <ul className="space-y-1.5 text-sm">
                        <li className="flex items-start">
                          <span className="mr-1.5">•</span>
                          <span>
                            <span className="font-medium">Very Low (&lt; 10)</span> → anecdotal.
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-1.5">•</span>
                          <span>
                            <span className="font-medium">Low (10-29)</span> → directional; sanity-check with more data.
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-1.5">•</span>
                          <span>
                            <span className="font-medium">Moderate (30-59)</span> → solid patterns emerge.
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-1.5">•</span>
                          <span>
                            <span className="font-medium">High (60 +)</span> → patterns may be reliable enough for
                            roadmap bets.
                          </span>
                        </li>
                      </ul>
                      <p className="text-sm italic border-t border-gray-200 pt-2 mt-2">
                        Tip: Always pair decision making with qualitative deep-dives, especially when low confidence.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="mt-1 flex items-center">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${confidenceColor.replace("text-", "bg-")} mr-1.5`}
              ></span>
              <span className="text-sm font-medium">{selectedSnapshot.confidence}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 mb-6">
        <div className="bg-[#FAFAFA] rounded-md border border-slate-200 p-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            Forty-three interviews provide moderately reliable evidence. A 45 % Very-disappointed score signals strong
            product-market fit. Coupled with a +72 sentiment index—markedly upbeat—this cohort represents loyal
            promoters who both depend on and advocate the product. The confidence level is medium, so findings should
            guide action but still warrant periodic checks as the sample grows.
          </p>
        </div>
      </div>
    </div>
  )
}
