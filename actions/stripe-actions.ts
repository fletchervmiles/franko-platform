"use server";

import { stripe, PLAN_RESPONSES, PLAN_INTERNAL_CHAT_QUERIES, PLAN_CHAT_INSTANCE_GENERATIONS, mapToDBMembership } from "@/lib/stripe";
import { db } from "@/db/db";
import { profilesTable } from "@/db/schema/profiles-schema";
import { eq } from "drizzle-orm";

export async function createCheckoutSession(
  userId: string, 
  plan: "starter" | "pro" | "business",
  customerEmail: string
) {
  try {
    if (!stripe) throw new Error("Stripe not initialized");
    
    // Get the user's profile to check for existing Stripe customer
    const existingProfile = await db.query.profiles.findFirst({
      where: eq(profilesTable.userId, userId)
    });
    
    let customerId: string;
    
    // Check if user already has a Stripe customer ID
    if (existingProfile?.stripeCustomerId) {
      console.log(`Using existing Stripe customer: ${existingProfile.stripeCustomerId}`);
      customerId = existingProfile.stripeCustomerId;
    } else {
      // Only create a new customer if one doesn't exist
      console.log(`Creating new Stripe customer for user: ${userId}`);
      const customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          userId,
        },
      });
      customerId = customer.id;
    }

    // Get the correct price ID for current plans
    let priceId;
    if (plan === "pro") {
      priceId = process.env.PRO_PRICE_ID;
    } else if (plan === "business") {
      priceId = process.env.BUSINESS_PRICE_ID;
    } else {
      priceId = process.env.STARTER_PRICE_ID;
    }

    console.log("Selected plan:", plan);
    console.log("Price ID being used:", priceId);

    if (!priceId) {
      throw new Error(`Invalid price ID for plan: ${plan}`);
    }

    // Map the UI plan names to our internal plan types
    let internalPlan: "starter_2024" | "pro_2024" | "business_2024";
    if (plan === "pro") {
      internalPlan = "pro_2024";
    } else if (plan === "business") {
      internalPlan = "business_2024";
    } else {
      internalPlan = "starter_2024";
    }
    
    const dbMembership = mapToDBMembership(internalPlan);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      metadata: {
        userId,
        plan: internalPlan, // Keep the full plan info in metadata
      },
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/workspace?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    });

    // We don't need to update the profile here since the webhook will handle it
    // This prevents double-counting of credits
    
    return session;
  } catch (error) {
    console.error("Server: Error in createCheckoutSession:", error);
    throw error;
  }
}

export async function createStripePortalSession(stripeCustomerId: string) {
  try {
    if (!stripeCustomerId) {
      throw new Error("No Stripe customer ID provided");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
    });

    return session.url;
  } catch (error) {
    console.error("Error creating portal session:", error);
    throw error instanceof Error ? error : new Error("Failed to create portal session");
  }
}

export async function updateProfileWithSubscription(
  userId: string,
  subscriptionId: string,
  customerId: string,
  plan: "starter" | "pro" | "business"
) {
  try {
    let internalPlan: "starter_2024" | "pro_2024" | "business_2024";
    if (plan === "pro") {
      internalPlan = "pro_2024";
    } else if (plan === "business") {
      internalPlan = "business_2024";
    } else {
      internalPlan = "starter_2024";
    }
    
    // Only store the Stripe IDs and let the webhook handle the credit calculations
    // This avoids double-counting when the webhook fires
    const updateData = {
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
    };

    console.log(`Updating Stripe IDs for user ${userId}:`, updateData);

    await db
      .update(profilesTable)
      .set(updateData)
      .where(eq(profilesTable.userId, userId));
      
    return { success: true };
  } catch (error) {
    console.error("Error updating profile with subscription:", error);
    throw error;
  }
}