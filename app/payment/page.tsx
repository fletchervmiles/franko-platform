"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { createCheckoutSession } from "@/actions/stripe-actions";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const { userId } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Payment page mounted with:", {
      plan,
      searchParams: Object.fromEntries(searchParams.entries()),
      userId,
      userLoaded,
      userEmail: user?.emailAddresses?.[0]?.emailAddress
    });
  }, [plan, searchParams, userId, user, userLoaded]);

  useEffect(() => {
    // Early return if user data isn't loaded yet
    if (!userLoaded) {
      console.log("User data not loaded yet");
      return;
    }

    // Validate required data
    if (!plan) {
      console.log("No plan found in URL parameters");
      setError("No plan selected");
      return;
    }

    if (!userId) {
      setError("No user ID found");
      return;
    }

    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      setError("No email address found");
      return;
    }

    // Validate plan type
    if (plan !== "starter" && plan !== "pro") {
      setError("Invalid plan selected");
      return;
    }

    const initializeCheckout = async () => {
      try {
        setIsLoading(true);
        console.log("Initializing checkout with:", { userId, plan, email });

        const session = await createCheckoutSession(
          userId,
          plan as "starter" | "pro",
          email
        );
        
        if (session?.url) {
          console.log("Redirecting to:", session.url);
          window.location.href = session.url;
        } else {
          throw new Error("No checkout URL returned");
        }
      } catch (err) {
        console.error("Checkout error:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize checkout");
      } finally {
        setIsLoading(false);
      }
    };

    initializeCheckout();
  }, [plan, userId, user?.emailAddresses, userLoaded]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => router.push('/pricing')}
          className="text-blue-500 hover:text-blue-700"
        >
          Return to Pricing
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p className="mb-4">{isLoading ? "Preparing your payment..." : "Redirecting to checkout..."}</p>
      {isLoading && (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      )}
    </div>
  );
} 