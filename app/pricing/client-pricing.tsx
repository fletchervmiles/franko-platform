"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createCheckoutSession } from "@/actions/stripe-actions";
import { useState } from "react";
import { Check, Zap, Rocket, Clock } from 'lucide-react';
import TestimonialCard from '@/components/lp-components/pricing-testimonial'
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ClientPricingProps {
  userId: string;
}

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

export default function ClientPricing({ userId }: ClientPricingProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePlanSelect = async (plan: "starter" | "pro") => {
    try {
      setIsLoading(plan);
      setError(null);

      const email = user?.emailAddresses?.[0]?.emailAddress;
      if (!email) {
        throw new Error("No email address found");
      }

      const session = await createCheckoutSession(userId, plan, email);
      
      if (session?.url) {
        window.location.href = session.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize checkout");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="py-16 sm:py-24">
      {error && (
        <div className="text-red-500 text-center mb-4">
          {error}
        </div>
      )}

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
              <button
                onClick={() => handlePlanSelect("starter")}
                disabled={!!isLoading}
                className={`w-full ${
                  isLoading === "starter"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-black hover:bg-gray-800"
                } text-white rounded-md py-3 px-4 font-bold transition-colors text-center h-11`}
              >
                {isLoading === "starter" ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full" />
                    Processing...
                  </span>
                ) : (
                  <>
                    Reduce Churn - Pay As You Go
                    <span aria-hidden="true" className="ml-2">→</span>
                  </>
                )}
              </button>

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
              </div>
              <p className="text-sm text-gray-500 mt-4">Note: Customer interview incentives are not included.</p>
            </CardContent>
          </Card>

          {/* Pro Plan */}
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
              <button
                onClick={() => handlePlanSelect("pro")}
                disabled={!!isLoading}
                className={`w-full ${
                  isLoading === "pro"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-100"
                } text-black rounded-md py-3 px-4 font-bold transition-colors text-center h-11`}
              >
                {isLoading === "pro" ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin h-5 w-5 mr-3 border-2 border-black border-t-transparent rounded-full" />
                    Processing...
                  </span>
                ) : (
                  <>
                    Reduce Churn - Pay As You Go
                    <span aria-hidden="true" className="ml-2">→</span>
                  </>
                )}
              </button>

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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}