"use server";

import { stripe, PLAN_RESPONSES, PLAN_INTERNAL_CHAT_QUERIES, PLAN_CHAT_INSTANCE_GENERATIONS, mapToDBMembership } from "@/lib/stripe";
import { db } from "@/db/db";
import { profilesTable } from "@/db/schema/profiles-schema";
import { eq } from "drizzle-orm";

// Simple in-memory lock to prevent concurrent customer creation
// Maps userId to a promise that resolves when the operation completes
const customerCreationLocks = new Map<string, Promise<string>>();

export async function createCheckoutSession(
  userId: string, 
  plan: "starter" | "growth" | "business",
  customerEmail: string
) {
  try {
    if (!stripe) throw new Error("Stripe not initialized");
    
    let customerId: string;
    
    // Check if there's an ongoing operation for this user
    if (customerCreationLocks.has(userId)) {
      console.log(`Waiting for existing customer creation for user: ${userId}`);
      // Wait for the existing operation to complete and use its result
      customerId = await customerCreationLocks.get(userId)!;
      console.log(`Using customer ID from concurrent operation: ${customerId}`);
    } else {
      // Create a new promise for this user's customer creation/lookup
      const customerPromise = (async () => {
        try {
          // Step 1: Check our database for existing customer ID
          const existingProfile = await db.query.profiles.findFirst({
            where: eq(profilesTable.userId, userId)
          });
          
          if (existingProfile?.stripeCustomerId) {
            console.log(`Using existing Stripe customer from profile: ${existingProfile.stripeCustomerId}`);
            return existingProfile.stripeCustomerId;
          } else {
            // Step 2: If not in our DB, search Stripe for existing customers with this email
            const existingCustomers = await stripe.customers.list({
              email: customerEmail,
              limit: 1
            });
            
            if (existingCustomers.data.length > 0) {
              // Use the first matching customer
              const foundCustomerId = existingCustomers.data[0].id;
              console.log(`Found existing Stripe customer by email: ${foundCustomerId}`);
              
              // Update their metadata with our userId if needed
              if (!existingCustomers.data[0].metadata?.userId) {
                await stripe.customers.update(foundCustomerId, {
                  metadata: { userId }
                });
                console.log(`Updated existing customer with userId: ${userId}`);
              }
              
              // Update our profile with this customer ID immediately
              if (existingProfile) {
                await db.update(profilesTable)
                  .set({ stripeCustomerId: foundCustomerId })
                  .where(eq(profilesTable.userId, userId));
                console.log(`Updated profile with existing customer ID: ${foundCustomerId}`);
              } else {
                // Create minimal profile if none exists
                await db.insert(profilesTable).values({
                  userId,
                  email: customerEmail,
                  stripeCustomerId: foundCustomerId,
                  membership: "free"
                });
                console.log(`Created new profile with existing customer ID: ${foundCustomerId}`);
              }
              
              return foundCustomerId;
            } else {
              // Step 3: Only create a new customer if no existing customer found
              console.log(`Creating new Stripe customer for user: ${userId}`);
              const customer = await stripe.customers.create({
                email: customerEmail,
                metadata: {
                  userId,
                },
              });
              const newCustomerId = customer.id;
              
              // Immediately update our profile with this new customer ID
              if (existingProfile) {
                await db.update(profilesTable)
                  .set({ stripeCustomerId: newCustomerId })
                  .where(eq(profilesTable.userId, userId));
                console.log(`Updated profile with new customer ID: ${newCustomerId}`);
              } else {
                // Create minimal profile if none exists
                await db.insert(profilesTable).values({
                  userId,
                  email: customerEmail,
                  stripeCustomerId: newCustomerId,
                  membership: "free"
                });
                console.log(`Created new profile with new customer ID: ${newCustomerId}`);
              }
              
              return newCustomerId;
            }
          }
        } finally {
          // Remove the lock when operation completes
          setTimeout(() => {
            customerCreationLocks.delete(userId);
          }, 2000); // Keep lock for 2 seconds to handle closely timed requests
        }
      })();
      
      // Store the promise in the lock map
      customerCreationLocks.set(userId, customerPromise);
      
      // Wait for the operation to complete
      customerId = await customerPromise;
    }

    // Get the correct price ID for current plans
    let priceId;
    if (plan === "growth") {
      priceId = process.env.GROWTH_PRICE_ID;
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
    let internalPlan: "starter_2024" | "growth_2024" | "business_2024";
    if (plan === "growth") {
      internalPlan = "growth_2024";
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
  plan: "starter" | "growth" | "business"
) {
  try {
    let internalPlan: "starter_2024" | "growth_2024" | "business_2024";
    if (plan === "growth") {
      internalPlan = "growth_2024";
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