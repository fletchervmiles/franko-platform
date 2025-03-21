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
    
    // Create Stripe customer first
    const customer = await stripe.customers.create({
      email: customerEmail,
      metadata: {
        userId,
      },
    });

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
      customer: customer.id,
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

    // Create initial profile record with mapped membership type
    const existingProfile = await db.query.profiles.findFirst({
      where: eq(profilesTable.userId, userId)
    });

    if (existingProfile) {
      // Calculate remaining credits for existing profile
      const responseCreditsRemaining = Math.max(0, 
        (existingProfile.totalResponsesQuota || 0) - (existingProfile.totalResponsesUsed || 0)
      );
      
      const chatQueryCreditsRemaining = Math.max(0, 
        (existingProfile.totalInternalChatQueriesQuota || 0) - (existingProfile.totalInternalChatQueriesUsed || 0)
      );
      
      const chatInstanceCreditsRemaining = Math.max(0, 
        (existingProfile.totalChatInstanceGenerationsQuota || 0) - (existingProfile.totalChatInstanceGenerationsUsed || 0)
      );

      // Update with carried-over credits
      await db.update(profilesTable).set({
        stripeCustomerId: customer.id,
        membership: dbMembership,
        // Reset used fields
        totalResponsesUsed: 0,
        totalInternalChatQueriesUsed: 0,
        totalChatInstanceGenerationsUsed: 0,
        // Set quota to new plan allocation + remaining credits
        totalResponsesQuota: PLAN_RESPONSES[internalPlan] + responseCreditsRemaining,
        totalResponsesAvailable: PLAN_RESPONSES[internalPlan] + responseCreditsRemaining,
        totalInternalChatQueriesQuota: PLAN_INTERNAL_CHAT_QUERIES[internalPlan] + chatQueryCreditsRemaining,
        totalInternalChatQueriesAvailable: PLAN_INTERNAL_CHAT_QUERIES[internalPlan] + chatQueryCreditsRemaining,
        totalChatInstanceGenerationsQuota: PLAN_CHAT_INSTANCE_GENERATIONS[internalPlan] + chatInstanceCreditsRemaining,
        totalChatInstanceGenerationsAvailable: PLAN_CHAT_INSTANCE_GENERATIONS[internalPlan] + chatInstanceCreditsRemaining,
      }).where(eq(profilesTable.userId, userId));
    } else {
      // Create new profile with plan quotas
      await db.insert(profilesTable).values({
        userId,
        email: customerEmail,
        stripeCustomerId: customer.id,
        membership: dbMembership,
        // Set used fields to zero
        totalResponsesUsed: 0,
        totalInternalChatQueriesUsed: 0,
        totalChatInstanceGenerationsUsed: 0,
        // Set quota and available to plan values
        totalResponsesQuota: PLAN_RESPONSES[internalPlan],
        totalResponsesAvailable: PLAN_RESPONSES[internalPlan],
        totalInternalChatQueriesQuota: PLAN_INTERNAL_CHAT_QUERIES[internalPlan],
        totalInternalChatQueriesAvailable: PLAN_INTERNAL_CHAT_QUERIES[internalPlan],
        totalChatInstanceGenerationsQuota: PLAN_CHAT_INSTANCE_GENERATIONS[internalPlan],
        totalChatInstanceGenerationsAvailable: PLAN_CHAT_INSTANCE_GENERATIONS[internalPlan],
      });
    }

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
    
    const dbMembership = mapToDBMembership(internalPlan);

    // Get current profile to calculate carryover
    const currentProfile = await db.query.profiles.findFirst({
      where: eq(profilesTable.userId, userId)
    });

    const updateData: Record<string, any> = {
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      membership: dbMembership,
    };

    if (currentProfile) {
      // Step 1: Calculate remaining credits for each quota type
      const responseCreditsRemaining = Math.max(0, 
        (currentProfile.totalResponsesQuota || 0) - (currentProfile.totalResponsesUsed || 0)
      );
      
      const chatQueryCreditsRemaining = Math.max(0, 
        (currentProfile.totalInternalChatQueriesQuota || 0) - (currentProfile.totalInternalChatQueriesUsed || 0)
      );
      
      const chatInstanceCreditsRemaining = Math.max(0, 
        (currentProfile.totalChatInstanceGenerationsQuota || 0) - (currentProfile.totalChatInstanceGenerationsUsed || 0)
      );
      
      console.log(`Carrying over credits for user ${userId}:`, {
        responseCreditsRemaining,
        chatQueryCreditsRemaining,
        chatInstanceCreditsRemaining
      });
      
      // Step 2: Reset used fields to zero
      updateData.totalResponsesUsed = 0;
      updateData.totalInternalChatQueriesUsed = 0;
      updateData.totalChatInstanceGenerationsUsed = 0;
      
      // Step 3: Set quota to new plan allocation + remaining credits
      updateData.totalResponsesQuota = PLAN_RESPONSES[internalPlan] + responseCreditsRemaining;
      updateData.totalResponsesAvailable = PLAN_RESPONSES[internalPlan] + responseCreditsRemaining;
      
      updateData.totalInternalChatQueriesQuota = PLAN_INTERNAL_CHAT_QUERIES[internalPlan] + chatQueryCreditsRemaining;
      updateData.totalInternalChatQueriesAvailable = PLAN_INTERNAL_CHAT_QUERIES[internalPlan] + chatQueryCreditsRemaining;
      
      updateData.totalChatInstanceGenerationsQuota = PLAN_CHAT_INSTANCE_GENERATIONS[internalPlan] + chatInstanceCreditsRemaining;
      updateData.totalChatInstanceGenerationsAvailable = PLAN_CHAT_INSTANCE_GENERATIONS[internalPlan] + chatInstanceCreditsRemaining;
    } else {
      // For new profiles, set all values from plan
      updateData.totalResponsesQuota = PLAN_RESPONSES[internalPlan];
      updateData.totalResponsesAvailable = PLAN_RESPONSES[internalPlan];
      updateData.totalResponsesUsed = 0;
      
      updateData.totalInternalChatQueriesQuota = PLAN_INTERNAL_CHAT_QUERIES[internalPlan];
      updateData.totalInternalChatQueriesAvailable = PLAN_INTERNAL_CHAT_QUERIES[internalPlan];
      updateData.totalInternalChatQueriesUsed = 0;
      
      updateData.totalChatInstanceGenerationsQuota = PLAN_CHAT_INSTANCE_GENERATIONS[internalPlan];
      updateData.totalChatInstanceGenerationsAvailable = PLAN_CHAT_INSTANCE_GENERATIONS[internalPlan];
      updateData.totalChatInstanceGenerationsUsed = 0;
    }

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