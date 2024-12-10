'use client'

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Zap, Rocket } from 'lucide-react'
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

export default function Pricing() {
  return (
    <div className="py-16 sm:py-24">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <Badge variant="outline" className="px-4 py-1.5">
            Pricing
          </Badge>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-6">
          Select your preferred plan
        </h2>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <Card className="w-full p-6 grid-background03">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-400">Starter</Badge>
                <Badge variant="destructive" className="bg-red-400">2024 Pricing Only</Badge>
              </div>
              
              <div className="flex items-baseline gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">$48.50</span>
                  <span className="text-sm text-muted-foreground">/one-time payment</span>
                </div>
                <div className="text-base font-semibold text-gray-600">
                  <span className="line-through">$97</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-1">
                  <span className="text-base">≈</span>
                  20 customer interviews
                </h3>
                <p className="text-sm text-muted-foreground">
                  100 minutes of customer interview time plus detailed analysis
                </p>
              </div>

              <Link href="/sign-up" className="w-full block">
                <Button className="w-full bg-black text-white hover:bg-gray-800" size="lg">
                  Get 100 mins of customer interview credits
                  <span aria-hidden="true" className="ml-2">→</span>
                </Button>
              </Link>

              <p className="text-sm text-muted-foreground">
                Ideal for businesses starting to dive into customer churn analysis.
              </p>

              <div>
                <div className="font-bold mb-4 text-sm">Benefits</div>
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-[#0070f3] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 text-sm">
                        {feature}
                        {feature === 'Comprehensive Per-Interview Analysis including:' && (
                          <ul className="mt-2 space-y-2 pl-4">
                            {analysisFeatures.map((subFeature, subIndex) => (
                              <li key={subIndex} className="flex items-start gap-3">
                                <span className="text-gray-600 text-sm before:content-['-'] before:mr-2">{subFeature}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-500 mt-4">Note: Customer interview incentives are not included.</p>
              </div>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="w-full p-6 bg-black text-white grid-background03-dark">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-400">Pro</Badge>
                <Badge variant="destructive" className="bg-red-400">2024 Pricing Only</Badge>
              </div>
              
              <div className="flex items-baseline gap-2">
                <Rocket className="h-5 w-5 text-blue-500" />
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">$98.50</span>
                  <span className="text-sm text-gray-400">/one-time payment</span>
                </div>
                <div className="text-base font-semibold text-gray-400">
                  <span className="line-through">$197</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-1 text-white">
                  <span className="text-base">≈</span>
                  50 customer interviews
                </h3>
                <p className="text-sm text-gray-400">
                  250 minutes of customer interview time plus detailed analysis
                </p>
              </div>

              <Link href="/sign-up" className="w-full block">
                <Button className="w-full bg-white text-black hover:bg-gray-100" size="lg">
                  Get 250 mins of customer interview credits
                  <span aria-hidden="true" className="ml-2">→</span>
                </Button>
              </Link>

              <TestimonialCard 
                name="Ben Goodman"
                role="Co-Founder and CEO"
                company="AgeMate"
                testimonial="Instrumental in improving our retention and understanding churn customer segments."
                avatarUrl="/assets/ben-agemate.png"
                avatarFallback="BG"
              />

              <p className="text-sm text-gray-400">
                Designed for companies committed to minimizing churn through extensive customer feedback.
              </p>

              <div>
                <div className="font-bold mb-4 text-sm text-white">Benefits</div>
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">
                        {feature}
                        {feature === 'Comprehensive Per-Interview Analysis including:' && (
                          <ul className="mt-2 space-y-2 pl-4">
                            {analysisFeatures.map((subFeature, subIndex) => (
                              <li key={subIndex} className="flex items-start gap-3">
                                <span className="text-gray-300 text-sm before:content-['-'] before:mr-2">{subFeature}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-500 mt-4">Note: Customer interview incentives are not included.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

