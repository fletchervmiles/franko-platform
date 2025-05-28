'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Check, ArrowRight, Info } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from "@clerk/nextjs"

const freeFeatures = [
  {
    feature: 'Up to <b>10</b> Conversation Responses',
    description: 'Completed customer conversations conducted by your AI agent'
  },
  {
    feature: 'Up to <b>3</b> Conversation Plans',
    description: 'Generated conversation plans to guide your agent'
  },
  {
    feature: 'Up to <b>10</b> Response Q&A',
    description: 'Chat with your aggregated response data, perfectly structured from your customer conversations'
  }
];

const growthFeatures = [
  {
    feature: 'AI Agent Interviewers',
    description: 'Run async AI-driven chat interviews that customers actually complete.'
  },
  {
    feature: 'Track Product-Market Fit continuously',
    description: 'Know your customer love metric at a glance, spot gaps early, and accelerate growth.'
  },
  {
    feature: 'Quantified personas done for you',
    description: 'Immediately understand who loves your product, why they do, and precisely how to attract more ideal users.'
  },
  {
    feature: 'Ask direct questions to your customer data',
    description: 'Easily query your growing proprietary feedback data using plain-language questions, no SQL or tagging required.'
  }
];

const growthLimits = [
  'Up to 200 Interview Responses/mo',
  'Generate Up to 50 AI Conversation Plans', 
  'Up to 200 Questions on your customer data'
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

  // Helper function to generate button text
  const getButtonText = (planName: string) => {
    if (!isSignedIn) return `Get ${planName}`
    if (isLoading) return 'Loading...'

    if (planName === 'Growth') {
      if (currentPlan === 'business') {
        return 'Current Plan'
      }
      return 'Upgrade to Growth'
    }

    if (planName === 'Free') {
      if (currentPlan === 'free') {
        return 'Current Plan'
      }
      return 'Downgrade to Free'
    }
    
    return `Get ${planName}`
  }

  // Helper to check if a button should be disabled
  const isButtonDisabled = (planName: string) => {
    if (planName === 'Growth') {
      return currentPlan === 'business'
    }
    if (planName === 'Free') {
      return currentPlan === 'free'
    }
    return false
  }

  // Helper to get the upgrade URL
  const getUpgradeUrl = (planName: string) => {
    if (planName === 'Growth') {
      return '/api/upgrade/business'
    }
    // For free plan, we could add a downgrade endpoint or just disable
    return '#'
  }

  return (
    <div className="pt-6">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-4">
          Choose Your Plan
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Start with our free plan and upgrade when you're ready to scale your customer feedback operations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card className="w-full p-4 grid-background03 flex flex-col">
          <CardHeader className="space-y-6 px-3 py-2">
            <div>
              <h3 className="text-xl md:text-2xl font-mono font-semibold">
                Free
              </h3>
            </div>

            <div className="p-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-base text-gray-500">/ forever</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 px-3 flex-grow flex flex-col">
            <p className="text-sm text-gray-700 leading-relaxed">
              Get a feel for Franko with starter limits. Includes everything in Growth plan.
            </p>

            <div className="flex-grow">
              <ul className="space-y-3">
                {freeFeatures.map((item, index) => (
                  <li key={index} className="flex flex-col">
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm" dangerouslySetInnerHTML={{ __html: item.feature }}></span>
                    </div>
                    <div className="ml-8 text-xs text-gray-600 italic mt-1">
                      {item.description}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 mt-auto">
              <div className={`rounded-lg overflow-hidden ${isButtonDisabled('Free') ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} p-[3px] relative`}>
                <div className={`rounded-lg ${isButtonDisabled('Free') ? 'bg-gray-100 text-gray-700 cursor-default' : 'bg-gray-900 text-white hover:bg-gray-800'} px-5 py-2.5 text-sm font-medium shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-all duration-200 ease-in-out inline-flex items-center justify-center w-full relative z-10`}>
                  {getButtonText('Free')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full p-4 bg-black text-white grid-background03-dark flex flex-col">
          <CardHeader className="space-y-6 px-3 py-2">
            <div>
              <h3 className="text-xl md:text-2xl font-mono font-semibold text-white">
                Growth
              </h3>
            </div>

            <div className="p-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">$199</span>
                <span className="text-base text-gray-400">/ month</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 px-3 flex-grow flex flex-col">
            <p className="text-sm text-gray-300 leading-relaxed">
              Everything you need to automatically measure and grow Product-Market Fit:
            </p>

            <div className="flex-grow">
              <ul className="space-y-4">
                {growthFeatures.map((item, index) => (
                  <li key={index} className="flex flex-col">
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-200 text-sm font-medium">{item.feature}</span>
                    </div>
                    <div className="ml-8 text-xs text-gray-400 leading-relaxed mt-1">
                      {item.description}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-3 font-medium">Production limits for scale:</p>
                <ul className="space-y-2">
                  {growthLimits.map((limit, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-gray-500 rounded-full flex-shrink-0"></span>
                      <span className="text-xs text-gray-400">{limit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 mt-auto">
              <div className={`rounded-lg overflow-hidden ${isButtonDisabled('Growth') ? 'bg-gray-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} p-[3px] relative`}>
                <Link 
                  href={isButtonDisabled('Growth') ? '#' : getUpgradeUrl('Growth')}
                  className={`rounded-lg ${isButtonDisabled('Growth') ? 'bg-gray-800 text-gray-400 cursor-default' : 'bg-white text-black hover:bg-gray-100'} px-5 py-2.5 text-sm font-medium shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-200 ease-in-out inline-flex items-center justify-center w-full relative z-10`}
                  onClick={(e) => isButtonDisabled('Growth') && e.preventDefault()}
                >
                  {getButtonText('Growth')}
                  {!isButtonDisabled('Growth') && <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-10">
        <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5">
          <Info className="h-4 w-4" />
          When you upgrade, your existing credits will be carried over to the next month.
        </p>
      </div>
    </div>
  )
}

