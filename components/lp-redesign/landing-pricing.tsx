"use client"

import { useState } from "react"
import Container from "@/components/lp-redesign/container"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Check, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { useRouter } from "next/navigation"

const pricingTiers = [
  {
    level: 10,
    price: 0,
    conversations: "10 AI conversations/mo",
    name: "Free",
  },
  {
    level: 100,
    price: 49,
    conversations: "100 AI conversations/mo",
    name: "Starter",
  },
  {
    level: 300,
    price: 99,
    conversations: "300 AI conversations/mo",
    name: "Growth",
  },
  {
    level: 1000,
    price: 199,
    conversations: "1000 AI conversations/mo",
    name: "Business",
  },
] as const

export default function LandingPricing() {
  const [tierIndex, setTierIndex] = useState(0)
  const router = useRouter()
  const currentTier = pricingTiers[tierIndex]

  const handleSignUp = () => {
    router.push('/sign-up')
  }

  return (
    <section className="py-28 md:py-40 overflow-hidden" style={{ backgroundColor: "#1A1919" }} data-section="pricing">
      <Container>
        {/* Heading */}
        <div className="max-w-4xl md:max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-normal leading-tight text-white">
            Simple Pricing.
          </h2>
        </div>

        {/* Pricing card wrapper */}
        <div className="mx-auto max-w-3xl md:max-w-4xl">
          <div className="bg-[#121212] text-white w-full rounded-3xl p-6 md:p-8 lg:p-10 border border-[#E4F222]">
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">
                  {currentTier.name.toUpperCase()}
                </h2>
              </div>
              <p className="text-gray-400">
                Everything you need for meaningful daily feedback from your users.
              </p>

              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-[rgba(228,242,34,1)]">
                    Starts at...
                  </p>
                  <div className="flex items-baseline gap-2">
                    {currentTier.price === 0 ? (
                      <span className="text-5xl font-bold">Free</span>
                    ) : (
                      <>
                        <span className="text-5xl font-bold">
                          ${currentTier.price}
                        </span>
                        <span className="text-gray-400">/ mo</span>
                      </>
                    )}
                  </div>
                </div>
                {/* Slider */}
                <div className="relative py-2">
                  <Slider
                    value={[tierIndex]}
                    onValueChange={(value) => setTierIndex(value[0])}
                    min={0}
                    max={pricingTiers.length - 1}
                    step={1}
                    className="w-full [&_.relative]:bg-white"
                    rangeClassName="bg-[#F5FF78]"
                    thumbClassName="bg-[#F5FF78] border-[#F5FF78]"
                    aria-label="Pricing tier slider"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 px-1">
                  {pricingTiers.map((tier) => (
                    <span key={tier.level}>{tier.level}</span>
                  ))}
                </div>
              </div>

              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 border-b border-dashed border-gray-500 cursor-help">
                          Up to {currentTier.level} Interview Responses / mo
                          <Info className="w-3 h-3 text-gray-400" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        className="bg-[#10755B]/90 text-white border-none max-w-xs text-center p-3"
                        side="top"
                      >
                        <p>
                          An interview response is counted when a respondent
                          meaningfully engages with the AI. Immediate abandonment
                          won't count, but partially completed responses will.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Interview Analysis in your Email</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Unlimited Modal Creation</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Access All Interview Agents</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Chat with Data</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Custom Branding</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Download Data (LLM Ready)</span>
                </li>
              </ul>

              <div className="space-y-3">
                <Button 
                  onClick={handleSignUp}
                  className="w-full bg-[#E4F222] hover:bg-[#F5FF78] text-[#0C0A08] py-3 rounded-lg text-base font-medium"
                >
                  {currentTier.price === 0 ? "Get started for free" : `Choose ${currentTier.name}`}
                </Button>
                <p className="text-center text-xs text-gray-500">
                  {currentTier.price === 0 ? "No CC required" : "Start with free plan, upgrade anytime"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
