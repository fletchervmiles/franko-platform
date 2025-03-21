'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from "@clerk/nextjs"

const starterFeatures = [
  {
    feature: 'Up to <b>40</b> Conversation Responses',
    description: 'Completed customer conversations conducted by your AI agent'
  },
  {
    feature: 'Up to <b>10</b> Conversation Plans',
    description: 'Generated conversation plans to guide your agent'
  },
  {
    feature: 'Up to <b>40</b> Response Q&A',
    description: 'Chat with your aggregated response data, perfectly structured from your customer conversations'
  }
];

const proFeatures = [
  {
    feature: 'Up to <b>100</b> Conversation Responses',
    description: 'Completed customer conversations conducted by your AI agent'
  },
  {
    feature: 'Up to <b>20</b> Conversation Plans',
    description: 'Generated conversation plans to guide your agent'
  },
  {
    feature: 'Up to <b>100</b> Response Q&A',
    description: 'Chat with your aggregated response data, perfectly structured from your customer conversations'
  }
];

const businessFeatures = [
  {
    feature: 'Up to <b>500</b> Conversation Responses',
    description: 'Completed customer conversations conducted by your AI agent'
  },
  {
    feature: 'Up to <b>50</b> Conversation Plans',
    description: 'Generated conversation plans to guide your agent'
  },
  {
    feature: 'Up to <b>500</b> Response Q&A',
    description: 'Chat with your aggregated response data, perfectly structured from your customer conversations'
  }
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
    if (!isSignedIn) return `Upgrade to ${planName}`
    if (isLoading) return 'Loading...'

    const planMap: Record<string, string> = {
      'starter': 'Starter',
      'pro': 'Pro',
      'business': 'Business'
    }

    if (currentPlan === planName.toLowerCase()) {
      return `Current Plan`
    }
    
    return `Upgrade to ${planName}`
  }

  // Helper to check if a button should be disabled
  const isButtonDisabled = (planName: string) => {
    return currentPlan === planName.toLowerCase()
  }

  return (
    <div className="pt-6">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-4">
          Upgrade Your Plan
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="w-full p-4 grid-background03 flex flex-col">
          <CardHeader className="space-y-6 px-3 py-2">
            <div>
              <h3 className="text-xl md:text-2xl font-mono font-semibold">
                Starter
              </h3>
            </div>

            <div className="p-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">$29</span>
                <span className="text-base text-gray-500">/ per month</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 px-3 flex-grow flex flex-col">
            <p className="text-sm text-gray-700 h-14 flex items-center">
              Start capturing customer conversations
            </p>

            <div className="flex-grow">
              <ul className="space-y-3">
                {starterFeatures.map((item, index) => (
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
              <div className={`rounded-lg overflow-hidden ${isButtonDisabled('starter') ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} p-[3px] relative`}>
                <Link 
                  href={isButtonDisabled('starter') ? '#' : "/api/upgrade/starter"} 
                  className={`rounded-lg ${isButtonDisabled('starter') ? 'bg-gray-100 text-gray-700 cursor-default' : 'bg-gray-900 text-white hover:bg-gray-800'} px-5 py-2.5 text-sm font-medium shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-all duration-200 ease-in-out inline-flex items-center justify-center w-full relative z-10`}
                  onClick={(e) => isButtonDisabled('starter') && e.preventDefault()}
                >
                  {getButtonText('Starter')}
                  {!isButtonDisabled('starter') && <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full p-4 bg-black text-white grid-background03-dark flex flex-col">
          <CardHeader className="space-y-6 px-3 py-2">
            <div>
              <h3 className="text-xl md:text-2xl font-mono font-semibold text-white">
                Pro
              </h3>
            </div>

            <div className="p-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">$59</span>
                <span className="text-base text-gray-400">/ per month</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 px-3 flex-grow flex flex-col">
            <p className="text-sm text-gray-300 h-14 flex items-center">
              Get serious about growing your customer conversation dataset
            </p>

            <div className="flex-grow">
              <ul className="space-y-3">
                {proFeatures.map((item, index) => (
                  <li key={index} className="flex flex-col">
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-200 text-sm" dangerouslySetInnerHTML={{ __html: item.feature }}></span>
                    </div>
                    <div className="ml-8 text-xs text-gray-400 italic mt-1">
                      {item.description}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 mt-auto">
              <div className={`rounded-lg overflow-hidden ${isButtonDisabled('pro') ? 'bg-gray-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} p-[3px] relative`}>
                <Link 
                  href={isButtonDisabled('pro') ? '#' : "/api/upgrade/pro"}
                  className={`rounded-lg ${isButtonDisabled('pro') ? 'bg-gray-800 text-gray-400 cursor-default' : 'bg-white text-black hover:bg-gray-100'} px-5 py-2.5 text-sm font-medium shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-200 ease-in-out inline-flex items-center justify-center w-full relative z-10`}
                  onClick={(e) => isButtonDisabled('pro') && e.preventDefault()}
                >
                  {getButtonText('Pro')}
                  {!isButtonDisabled('pro') && <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full p-4 grid-background03 flex flex-col">
          <CardHeader className="space-y-6 px-3 py-2">
            <div>
              <h3 className="text-xl md:text-2xl font-mono font-semibold">
                Business
              </h3>
            </div>

            <div className="p-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">$199</span>
                <span className="text-base text-gray-500">/ per month</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 px-3 flex-grow flex flex-col">
            <p className="text-sm text-gray-700 h-14 flex items-center">
              Scale conversations across your entire customer journey
            </p>

            <div className="flex-grow">
              <ul className="space-y-3">
                {businessFeatures.map((item, index) => (
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
              <div className={`rounded-lg overflow-hidden ${isButtonDisabled('business') ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} p-[3px] relative`}>
                <Link 
                  href={isButtonDisabled('business') ? '#' : "/api/upgrade/business"}
                  className={`rounded-lg ${isButtonDisabled('business') ? 'bg-gray-100 text-gray-700 cursor-default' : 'bg-gray-900 text-white hover:bg-gray-800'} px-5 py-2.5 text-sm font-medium shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-all duration-200 ease-in-out inline-flex items-center justify-center w-full relative z-10`}
                  onClick={(e) => isButtonDisabled('business') && e.preventDefault()}
                >
                  {getButtonText('Business')}
                  {!isButtonDisabled('business') && <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

