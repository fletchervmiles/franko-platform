'use client'

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Zap, Rocket, Clock } from 'lucide-react'
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
    <div>
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <Badge variant="outline" className="px-4 py-1.5">
            Pricing
          </Badge>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-6">
          Figure out the WHY behind<br />
          your churn, fast!
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        <Card className="w-full p-6 grid-background03">
          <CardHeader className="space-y-8">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-400">Starter</Badge>
              <Badge variant="destructive" className="bg-red-400">Early Adopter Pricing</Badge>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-3">
                100 minutes of interview credits
                <div className="text-sm text-muted-foreground">
                  (≈10-20 customer interviews)
                </div>
              </h3>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">$48.50</span>
                    <span className="text-base font-semibold text-gray-600">
                      <span className="line-through">$97</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>50% Off</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Valid through 2024</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Link href="/sign-up" className="w-full block">
              <Button className="w-full bg-black text-white hover:bg-gray-800 font-bold" size="lg">
                Reduce Churn - Pay As You Go
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

        <Card className="w-full p-6 bg-black text-white grid-background03-dark">
          <CardHeader className="space-y-8">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-400">Pro</Badge>
              <Badge variant="destructive" className="bg-red-400">Early Adopter Pricing</Badge>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-3 text-white">
                250 minutes of interview credits
                <div className="text-sm text-gray-400">
                  (≈25-50 customer interviews)
                </div>
              </h3>

              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">$98.50</span>
                    <span className="text-base font-semibold text-gray-400">
                      <span className="line-through">$197</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>50% Off</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>Valid through 2024</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Link href="/sign-up" className="w-full block">
              <Button className="w-full bg-white text-black hover:bg-gray-100 font-bold" size="lg">
                Reduce Churn - Pay As You Go
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
  )
}

