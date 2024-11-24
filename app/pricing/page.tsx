"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function PricingPage() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    // If not authenticated, redirect to sign-up
    if (!userId) {
      router.push('/sign-up');
      return;
    }

    setIsLoading(false);
  }, [userId, isLoaded, router]);

  const handlePlanSelect = async (plan: "starter" | "pro") => {
    if (!userId) {
      console.error("No user ID found");
      return;
    }

    router.push(`/payment?plan=${plan}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="border p-6 rounded-lg">
          <h2 className="text-xl font-bold">Starter Plan</h2>
          <p>200 minutes/month</p>
          <button
            onClick={() => handlePlanSelect("starter")}
            className="w-full bg-blue-500 text-white py-2 rounded"
          >
            Get Started
          </button>
        </div>
        <div className="border p-6 rounded-lg">
          <h2 className="text-xl font-bold">Pro Plan</h2>
          <p>500 minutes/month</p>
          <button
            onClick={() => handlePlanSelect("pro")}
            className="w-full bg-blue-500 text-white py-2 rounded"
          >
            Get Pro
          </button>
        </div>
      </div>
    </div>
  );
} 