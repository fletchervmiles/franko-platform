"use server";

import { stripe, PLAN_MINUTES } from "@/lib/stripe";
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

    // Get the correct price ID
    const priceId = plan === "pro" 
      ? process.env.STRIPE_PRO_PRICE_ID 
      : process.env.STRIPE_STARTER_PRICE_ID;

    if (!priceId) {
      throw new Error(`Invalid price ID for plan: ${plan}`);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      metadata: {
        userId,
        plan,
      },
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    });

    // Create initial profile record
    await db.insert(profilesTable).values({
      userId,
      email: customerEmail,
      stripeCustomerId: customer.id,
      membership: plan,
      monthlyMinutes: PLAN_MINUTES[plan],
      minutesAvailable: PLAN_MINUTES[plan],
    }).onConflictDoUpdate({
      target: profilesTable.userId,
      set: {
        stripeCustomerId: customer.id,
        membership: plan,
        monthlyMinutes: PLAN_MINUTES[plan],
        minutesAvailable: PLAN_MINUTES[plan],
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
    await db
      .update(profilesTable)
      .set({
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        membership: plan,
        monthlyMinutes: PLAN_MINUTES[plan],
        minutesAvailable: PLAN_MINUTES[plan],
      })
      .where(eq(profilesTable.userId, userId));
  } catch (error) {
    console.error("Error updating profile with subscription:", error);
    throw error;
  }
}