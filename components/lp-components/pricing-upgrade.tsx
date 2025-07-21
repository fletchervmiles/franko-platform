'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Check, ArrowRight, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from "@clerk/nextjs"

const plans = [
  {
    name: "Starter",
    price: 49,
    responses: 100,
    popular: false
  },
  {
    name: "Growth", 
    price: 99,
    responses: 300,
    popular: true
  },
  {
    name: "Business",
    price: 199, 
    responses: 1000,
    popular: false
  }
];

// Features that are the same across all plans (from landing-pricing.tsx)
const sharedFeatures = [
  "Interview Analysis in your Email",
  "Unlimited Modal Creation", 
  "Access All Interview Agents",
  "Chat with Data",
  "Custom Branding",
  "Download Data (LLM Ready)"
];

export default function PricingUpgrade() {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { userId, isSignedIn } = useAuth()

  useEffect(() => {
    async function fetchUserProfile() {
      if (!isSignedIn || !userId) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          setCurrentPlan(data.membership || 'free')
        } else {
          console.error('Failed to fetch user profile')
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [isSignedIn, userId])

  // Helper function to determine plan hierarchy
  const getPlanLevel = (planName: string) => {
    const levels = { free: 0, starter: 1, growth: 2, business: 3 }
    return levels[planName.toLowerCase() as keyof typeof levels] || 0
  }

  // Helper function to generate button text and state
  const getButtonState = (planName: string) => {
    if (!isSignedIn) return { 
      text: `Get ${planName}`, 
      href: `/api/upgrade/${planName.toLowerCase()}`,
      disabled: false,
      style: "upgrade" 
    }
    
    if (isLoading) return { 
      text: 'Loading...', 
      disabled: true, 
      style: "loading" 
    }

    const currentLevel = getPlanLevel(currentPlan || 'free')
    const targetLevel = getPlanLevel(planName)

    if (currentLevel === targetLevel) {
      return { 
        text: "Current Plan", 
        disabled: true, 
        style: "current" 
      }
    } else if (targetLevel > currentLevel) {
      return { 
        text: `Upgrade to ${planName}`, 
        href: `/api/upgrade/${planName.toLowerCase()}`,
        disabled: false,
        style: "upgrade" 
      }
    } else {
      return { 
        text: `Downgrade to ${planName}`, 
        href: `/api/upgrade/${planName.toLowerCase()}`,
        disabled: false,
        style: "downgrade" 
      }
    }
  }

  return (
    <div className="pt-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          Choose Your Plan
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Scale your customer feedback operations with the right plan for your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const buttonState = getButtonState(plan.name)
          
          return (
            <Card key={plan.name} className={`relative flex flex-col h-full ${
              plan.popular 
                ? 'border-2 border-[#E4F222]/70 shadow-md' 
                : 'border border-gray-200 shadow-sm'
            }`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#E4F222] text-black px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>

              <CardContent className="flex-grow flex flex-col">
                <ul className="space-y-3 mb-8 flex-grow">
                  {/* Primary feature - Response count with tooltip */}
                  <li className="flex items-start gap-3 pb-2 border-b border-gray-100">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <TooltipProvider>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <span className="font-semibold text-gray-900 text-sm flex items-center gap-1 border-b border-dashed border-gray-400 cursor-help">
                            Up to {plan.responses.toLocaleString()} Interview Responses / mo
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
                  
                  {/* Other features */}
                  {sharedFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  {buttonState.href ? (
                    <Link 
                      href={buttonState.href}
                      className={`
                        w-full rounded-lg px-3 py-2 text-center font-medium transition-all duration-200 
                        inline-flex items-center justify-center gap-2
                        ${buttonState.style === 'upgrade' 
                          ? 'bg-gray-900 hover:bg-black text-white shadow-sm'
                          : buttonState.style === 'downgrade'
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        }
                      `}
                    >
                      {buttonState.text}
                      {!buttonState.disabled && buttonState.style === 'upgrade' && (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </Link>
                  ) : (
                    <div className={`
                      w-full rounded-lg px-3 py-2 text-center font-medium
                      ${buttonState.style === 'current' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-gray-50 text-gray-400'
                      }
                    `}>
                      {buttonState.text}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Cancel subscription link - only show for paid plans */}
      {isSignedIn && !isLoading && currentPlan && currentPlan !== 'free' && (
        <div className="text-center mt-8">
          <Link 
            href="/account"
            className="text-sm text-gray-500 hover:text-gray-700 underline-offset-4 hover:underline transition-colors"
          >
            Cancel your subscription
          </Link>
        </div>
      )}
    </div>
  )
}

