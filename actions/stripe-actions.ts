"use server";

import { stripe, PLAN_RESPONSES, mapToDBMembership } from "@/lib/stripe";
import { db } from "@/db/db";
import { profilesTable } from "@/db/schema/profiles-schema";
import { eq } from "drizzle-orm";

export async function createCheckoutSession(
  userId: string, 
  plan: "starter" | "pro",
  customerEmail: string
) {
  try {
    if (!stripe) throw new Error("Stripe not initialized");
    
    // Create Stripe customer first
    const customer = await stripe.customers.create({
      email: customerEmail,
      metadata: {
        userId,
      },
    });

    // Get the correct price ID for 2024 plans
    const priceId = plan === "pro" 
      ? process.env.STRIPE_PRO_2024_PRICE_ID 
      : process.env.STRIPE_STARTER_2024_PRICE_ID;

    console.log("Selected plan:", plan);
    console.log("Price ID being used:", priceId);

    if (!priceId) {
      throw new Error(`Invalid price ID for plan: ${plan}`);
    }

    // Map the UI plan names to our internal plan types
    const internalPlan = plan === "pro" ? "pro_2024" : "starter_2024";
    const dbMembership = mapToDBMembership(internalPlan);

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "payment",
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

    // Create initial profile record with mapped membership type
    await db.insert(profilesTable).values({
      userId,
      email: customerEmail,
      stripeCustomerId: customer.id,
      membership: dbMembership,
      totalResponsesQuota: PLAN_RESPONSES[internalPlan],
      totalResponsesAvailable: PLAN_RESPONSES[internalPlan],
    }).onConflictDoUpdate({
      target: profilesTable.userId,
      set: {
        stripeCustomerId: customer.id,
        membership: dbMembership,
        totalResponsesQuota: PLAN_RESPONSES[internalPlan],
        totalResponsesAvailable: PLAN_RESPONSES[internalPlan],
      }
    });

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
  plan: "starter" | "pro"
) {
  try {
    const internalPlan = plan === "pro" ? "pro_2024" : "starter_2024";
    const dbMembership = mapToDBMembership(internalPlan);

    await db
      .update(profilesTable)
      .set({
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        membership: dbMembership,
        totalResponsesQuota: PLAN_RESPONSES[internalPlan],
        totalResponsesAvailable: PLAN_RESPONSES[internalPlan],
      })
      .where(eq(profilesTable.userId, userId));
  } catch (error) {
    console.error("Error updating profile with subscription:", error);
    throw error;
  }
}