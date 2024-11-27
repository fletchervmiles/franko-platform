"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createCheckoutSession } from "@/actions/stripe-actions";
import { useState } from "react";
import { Check, Zap, Rocket } from 'lucide-react';

interface ClientPricingProps {
  userId: string;
}

const features = [
  '10-minute AI-powered phone interviews to understand customer churn',
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
                <div className="text-4xl font-bold">$147</div>
              </div>
              <p className="text-gray-600 mb-2 text-sm">180 mins | ≈ 18 interviews</p>
              <p className="text-black text-sm">Ideal for businesses starting to dive into customer churn analysis.</p>
            </div>

            <button
              onClick={() => handlePlanSelect("starter")}
              disabled={!!isLoading}
              className={`block w-full ${
                isLoading === "starter"
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-800"
              } text-white rounded-full py-3 px-4 font-medium transition-colors mb-8 text-center`}
            >
              {isLoading === "starter" ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full" />
                  Processing...
                </span>
              ) : (
                "Get your churn AI researcher →"
              )}
            </button>

            {/* Features section remains the same as pricing-post-signup */}
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
                <div className="text-4xl font-bold">$247</div>
              </div>
              <p className="text-white mb-2 text-sm">480 mins | ≈ 48 interviews</p>
              <p className="text-white text-sm">Designed for companies committed to minimizing churn through extensive customer feedback.</p>
            </div>

            <button
              onClick={() => handlePlanSelect("pro")}
              disabled={!!isLoading}
              className={`block w-full ${
                isLoading === "pro"
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gray-100"
              } text-black rounded-full py-3 px-4 font-medium transition-colors mb-8 text-center`}
            >
              {isLoading === "pro" ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin h-5 w-5 mr-3 border-2 border-black border-t-transparent rounded-full" />
                  Processing...
                </span>
              ) : (
                "Get your churn AI researcher →"
              )}
            </button>

            {/* Features section remains the same as pricing-post-signup */}
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
  );
} 