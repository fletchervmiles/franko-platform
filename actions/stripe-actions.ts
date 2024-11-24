"use server";

import { stripe } from "@/lib/stripe";

export async function createCheckoutSession(
  userId: string, 
  plan: "starter" | "pro",
  customerEmail: string
) {
  try {
    if (!stripe) throw new Error("Stripe not initialized");
    
    // Get the correct price ID
    const priceId = plan === "pro" 
      ? process.env.STRIPE_PRO_PRICE_ID 
      : process.env.STRIPE_STARTER_PRICE_ID;

    // Log the selected plan and price (server-side)
    console.log("Server: Plan selection:", {
      selectedPlan: plan,
      selectedPriceId: priceId,
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
    });

    // Validate price ID exists and format
    if (!priceId) {
      throw new Error(`Price ID not configured for plan: ${plan}`);
    }

    if (!priceId.startsWith('price_')) {
      throw new Error(`Invalid price ID format for plan: ${plan}`);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: customerEmail,
      client_reference_id: userId,
      metadata: {
        plan,
        userId,
      },
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    });

    return session;
  } catch (error) {
    console.error("Server: Error in createCheckoutSession:", error);
    throw error;
  }
}