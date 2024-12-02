'use client'

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
          <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black border border-gray-200 shadow-sm">
            Pricing
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Select your preferred plan
        </h2>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className="relative rounded-2xl border border-gray-200 bg-white p-8 transition-shadow hover:shadow-lg grid-background03">
            <div className="mb-6">
              <span className="inline-flex items-center rounded-full bg-[#0070f3] px-2.5 py-0.5 text-xs font-medium text-white mb-4">
                Starter
              </span>
              <div className="flex items-center mb-4">
                <Zap className="w-6 h-6 text-[#0070f3] mr-2" />
                <div className="text-4xl font-bold">$97</div>
              </div>
              <p className="text-gray-600 mb-2 text-sm">200 mins | ≈ 40 interviews</p>
              <p className="text-black text-sm">Ideal for businesses starting to dive into customer churn analysis.</p>
            </div>

            <Link 
              href="/sign-up" 
              className="block w-full bg-black text-white rounded-full py-3 px-4 font-medium hover:bg-gray-800 transition-colors mb-8 text-center"
            >
              Get your churn AI researcher →
            </Link>

            <div>
              <div className="font-medium mb-4 text-sm">Features:</div>
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
            </div>
            <p className="text-sm text-gray-500 mt-4">Note: Customer interview incentives are not included.</p>
          </div>

          {/* Pro Plan */}
          <div className="relative rounded-2xl bg-black p-8 text-white transition-shadow hover:shadow-lg grid-background03-dark">
            <div className="mb-6">
              <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-black mb-4">
                Pro
              </span>
              <div className="flex items-center mb-4">
                <Rocket className="w-6 h-6 text-[#0070f3] mr-2" />
                <div className="text-4xl font-bold">$197</div>
              </div>
              <p className="text-white mb-2 text-sm">500 mins | ≈ 100 interviews</p>
              <p className="text-white text-sm">Designed for companies committed to minimizing churn through extensive customer feedback.</p>
            </div>

            <div className="mb-8">
              <TestimonialCard 
                name="Ben Goodman"
                role="Co-Founder and CEO"
                company="AgeMate"
                testimonial="Instrumental in improving our retention and understanding churn customer segments."
                avatarUrl="/assets/ben-agemate.png"
                avatarFallback="BG"
              />
            </div>

            <Link 
              href="/sign-up" 
              className="block w-full bg-white text-black rounded-full py-3 px-4 font-medium hover:bg-gray-100 transition-colors mb-8 text-center"
            >
              Get your churn AI researcher →
            </Link>

            <div>
              <div className="font-medium mb-4 text-sm">Features:</div>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-[#0070f3] flex-shrink-0 mt-0.5" />
                    <span className="text-white text-sm">
                      {feature}
                      {feature === 'Comprehensive Per-Interview Analysis including:' && (
                        <ul className="mt-2 space-y-2 pl-4">
                          {analysisFeatures.map((subFeature, subIndex) => (
                            <li key={subIndex} className="flex items-start gap-3">
                              <span className="text-white text-sm before:content-['-'] before:mr-2">{subFeature}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-gray-500 mt-4">Note: Customer interview incentives are not included.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

