'use client'

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Zap, Rocket, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import TestimonialCard from './pricing-testimonial'
import { useState } from 'react'
import EarlyAccessModal from '../lp-redesign/early-access-modal'

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
  'Up to 300 Interview Responses/mo',
  'Generate Up to 50 AI Conversation Plans', 
  'Up to 50 Questions on your customer data'
];

export default function Pricing() {
  const [showModal, setShowModal] = useState(false)

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
              <div className="rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 p-[3px] relative">
                <button 
                  onClick={() => setShowModal(true)}
                  className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-all duration-200 ease-in-out inline-flex items-center justify-center w-full relative z-10"
                >
                  Try for free
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </button>
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
              <div className="rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 p-[3px] relative">
                <button 
                  onClick={() => setShowModal(true)}
                  className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-200 ease-in-out inline-flex items-center justify-center w-full relative z-10"
                >
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </button>
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

      <EarlyAccessModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}

