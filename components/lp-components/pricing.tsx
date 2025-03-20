'use client'

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Zap, Rocket, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import TestimonialCard from './pricing-testimonial'

const features = [
  '5-minute AI-powered phone interviews to understand customer churn',
  'Interview Agent with Exploratory, Narrative-Driven Approach',
  'Dedicated and Contextualized to Your Business',
  'Unique URL to Invite Customers',
  'Audio Recordings of Interviews',
  'Full Interview Transcripts',
  'Comprehensive Per-Interview Analysis including:',
  'Dashboard with all your interviews'
];

const analysisFeatures = [
  'Reasons for canceling',
  'Unmet expectations',
  'Suggestions for improvement',
  'Identification of win-back opportunities',
  'Recommendations / actions'
];

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

export default function Pricing() {
  return (
    <div className="py-20">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <Badge variant="outline" className="px-4 py-1.5">
            Pricing
          </Badge>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-6">
        Explore Plans
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
                <span className="text-base text-gray-500">/ once off</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 px-3 flex-grow flex flex-col">
            <p className="text-sm text-gray-700 h-14 flex items-center">
              Get a feel for Franko
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
              <div className="rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 p-[3px] relative">
                <Link href="/sign-up" className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-all duration-200 ease-in-out inline-flex items-center justify-center w-full relative z-10">
                  Try for free
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
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
              <div className="rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 p-[3px] relative">
                <Link href="/sign-up" className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-all duration-200 ease-in-out inline-flex items-center justify-center w-full relative z-10">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
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
              <div className="rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 p-[3px] relative">
                <Link href="/sign-up" className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-200 ease-in-out inline-flex items-center justify-center w-full relative z-10">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
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
              <div className="rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 p-[3px] relative">
                <Link href="/sign-up" className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-all duration-200 ease-in-out inline-flex items-center justify-center w-full relative z-10">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .shimmer-effect {
          animation: shimmer 5s infinite;
          animation-timing-function: ease-in-out;
          opacity: 0.3;
        }
        
        .shimmer-bg {
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

