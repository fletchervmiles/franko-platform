"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createCheckoutSession } from "@/actions/stripe-actions";
import { useState } from "react";

interface ClientPricingProps {
  userId: string;
}

const PRICING_PLANS = [
  {
    name: "Starter Plan",
    minutes: 200,
    price: "$19/month",
    type: "starter" as const
  },
  {
    name: "Pro Plan",
    minutes: 500,
    price: "$49/month",
    type: "pro" as const
  }
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
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="text-red-500 text-center mb-4">
          {error}
        </div>
      )}
      
      <h1 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h1>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {PRICING_PLANS.map((plan) => (
          <div key={plan.type} className="border p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-bold mb-4">{plan.name}</h2>
            <p className="text-xl mb-2">{plan.minutes} minutes/month</p>
            <p className="text-2xl font-bold mb-6">{plan.price}</p>
            <button
              onClick={() => handlePlanSelect(plan.type)}
              disabled={!!isLoading}
              className={`w-full py-3 rounded-lg transition ${
                isLoading === plan.type
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {isLoading === plan.type ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full" />
                  Processing...
                </span>
              ) : (
                `Select ${plan.name}`
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 