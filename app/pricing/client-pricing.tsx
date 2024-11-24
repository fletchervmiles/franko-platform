"use client";

import { useRouter } from "next/navigation";

interface ClientPricingProps {
  userId: string;
}

export default function ClientPricing({ userId }: ClientPricingProps) {
  const router = useRouter();

  const handlePlanSelect = async (plan: "starter" | "pro") => {
    if (!userId) {
      console.error("No user ID found");
      return;
    }

    router.push(`/payment?plan=${plan}`);
  };

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