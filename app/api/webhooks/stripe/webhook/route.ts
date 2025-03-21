import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { getProfileByUserId, updateProfile } from "@/db/queries/profiles-queries";
import { PLAN_RESPONSES, PLAN_INTERNAL_CHAT_QUERIES, PLAN_CHAT_INSTANCE_GENERATIONS, type MembershipTier } from "@/lib/stripe";
import type Stripe from "stripe";
import { mapToDBMembership } from "@/lib/stripe";
import { db } from "@/db/db";
import { profilesTable } from "@/db/schema/profiles-schema";
import { eq } from "drizzle-orm";

// Add type safety for the plan parameter
type UIPlan = "starter" | "pro" | "business";
type InternalPlan = "starter_2024" | "pro_2024" | "business_2024";

// Use the new App Router configuration syntax
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Helper function to calculate and update credit allocations
 * Centralizes the logic to prevent inconsistencies
 */
async function updateUserCredits(
  userId: string, 
  plan: "starter_2024" | "pro_2024" | "business_2024" | "free", 
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
) {
  console.log(`[Credit Update] Updating credits for user ${userId} to plan ${plan}`);
  console.log(`[Credit Update] Customer ID: ${stripeCustomerId}, Subscription ID: ${stripeSubscriptionId}`);
  
  // Get current profile
  const currentProfile = await getProfileByUserId(userId);
  const dbMembership = mapToDBMembership(plan);
  
  // Prepare update data
  const updatedProfile: Record<string, any> = {
    membership: dbMembership,
  };
  
  // Add Stripe IDs if provided
  if (stripeCustomerId) {
    updatedProfile.stripeCustomerId = stripeCustomerId;
  }
  
  if (stripeSubscriptionId) {
    updatedProfile.stripeSubscriptionId = stripeSubscriptionId;
  }
  
  // Log current state before calculation
  if (currentProfile) {
    console.log("[Credit Update] Current profile state:", {
      userId,
      membership: currentProfile.membership,
      responseQuota: currentProfile.totalResponsesQuota,
      responseUsed: currentProfile.totalResponsesUsed,
      chatQueryQuota: currentProfile.totalInternalChatQueriesQuota,
      chatQueryUsed: currentProfile.totalInternalChatQueriesUsed,
      chatInstanceQuota: currentProfile.totalChatInstanceGenerationsQuota,
      chatInstanceUsed: currentProfile.totalChatInstanceGenerationsUsed,
    });
  }
  
  if (currentProfile) {
    // Calculate remaining credits - simply what's left unused
    const responseCreditsRemaining = Math.max(0, 
      (currentProfile.totalResponsesQuota || 0) - (currentProfile.totalResponsesUsed || 0)
    );
    
    const chatQueryCreditsRemaining = Math.max(0, 
      (currentProfile.totalInternalChatQueriesQuota || 0) - (currentProfile.totalInternalChatQueriesUsed || 0)
    );
    
    const chatInstanceCreditsRemaining = Math.max(0, 
      (currentProfile.totalChatInstanceGenerationsQuota || 0) - (currentProfile.totalChatInstanceGenerationsUsed || 0)
    );
    
    console.log("[Credit Update] Calculated remaining credits:", {
      responseCreditsRemaining,
      chatQueryCreditsRemaining,
      chatInstanceCreditsRemaining
    });
    
    // Reset used fields to zero
    updatedProfile.totalResponsesUsed = 0;
    updatedProfile.totalInternalChatQueriesUsed = 0;
    updatedProfile.totalChatInstanceGenerationsUsed = 0;
    
    // Set quota to new plan allocation + remaining credits
    updatedProfile.totalResponsesQuota = PLAN_RESPONSES[plan] + responseCreditsRemaining;
    updatedProfile.totalResponsesAvailable = PLAN_RESPONSES[plan] + responseCreditsRemaining;
    
    updatedProfile.totalInternalChatQueriesQuota = PLAN_INTERNAL_CHAT_QUERIES[plan] + chatQueryCreditsRemaining;
    updatedProfile.totalInternalChatQueriesAvailable = PLAN_INTERNAL_CHAT_QUERIES[plan] + chatQueryCreditsRemaining;
    
    updatedProfile.totalChatInstanceGenerationsQuota = PLAN_CHAT_INSTANCE_GENERATIONS[plan] + chatInstanceCreditsRemaining;
    updatedProfile.totalChatInstanceGenerationsAvailable = PLAN_CHAT_INSTANCE_GENERATIONS[plan] + chatInstanceCreditsRemaining;
  } else {
    // For new users, set quotas directly from plan
    console.log("[Credit Update] No existing profile, setting initial credits");
    
    updatedProfile.totalResponsesQuota = PLAN_RESPONSES[plan];
    updatedProfile.totalResponsesAvailable = PLAN_RESPONSES[plan];
    updatedProfile.totalResponsesUsed = 0;
    
    updatedProfile.totalInternalChatQueriesQuota = PLAN_INTERNAL_CHAT_QUERIES[plan];
    updatedProfile.totalInternalChatQueriesAvailable = PLAN_INTERNAL_CHAT_QUERIES[plan];
    updatedProfile.totalInternalChatQueriesUsed = 0;
    
    updatedProfile.totalChatInstanceGenerationsQuota = PLAN_CHAT_INSTANCE_GENERATIONS[plan];
    updatedProfile.totalChatInstanceGenerationsAvailable = PLAN_CHAT_INSTANCE_GENERATIONS[plan];
    updatedProfile.totalChatInstanceGenerationsUsed = 0;
  }
  
  // Log the final state that will be applied
  console.log("[Credit Update] Updating profile with values:", updatedProfile);
  
  // Use DB transaction to update profile
  await updateProfile(userId, updatedProfile);
  
  console.log(`[Credit Update] Profile update completed for user ${userId}`);
  return { success: true, updatedProfile };
}

// Disable automatic body parsing
export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("Stripe-Signature");
    
    console.log("[Webhook] Received webhook request");
    
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("[Webhook] Missing signature or webhook secret");
      return new Response("Missing signature or webhook secret", { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`[Webhook] Signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return new Response(
        JSON.stringify({
          error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    console.log("[Webhook] Event type:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log("[Webhook] Checkout session completed:", {
          id: session.id,
          customer: session.customer,
          metadata: session.metadata,
          payment_status: session.payment_status,
          mode: session.mode,
          subscription: session.subscription,
        });

        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as InternalPlan;
        
        if (!userId) {
          console.error("[Webhook] No userId found in session metadata");
          throw new Error("No userId found in session metadata");
        }
        
        if (!plan) {
          console.error("[Webhook] No plan found in session metadata");
          throw new Error("No plan found in session metadata");
        }

        // Use our centralized credit update function
        await updateUserCredits(
          userId, 
          plan, 
          session.customer as string,
          session.subscription as string
        );
        
        break;
      }

      // Handle subscription updates
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subscriptionStatus = subscription.status;
        const userId = subscription.metadata.userId;
        
        console.log("[Webhook] Subscription updated:", {
          id: subscription.id,
          customer: customerId,
          status: subscriptionStatus,
          userId: userId
        });
        
        if (!userId) {
          console.error("[Webhook] No userId found in subscription metadata");
          
          // Try to find profile by customer ID
          const profiles = await db.query.profiles.findMany({
            where: eq(profilesTable.stripeCustomerId, customerId)
          });
          
          if (profiles.length === 0) {
            console.error(`[Webhook] No profile found for customer: ${customerId}`);
            break;
          }
          
          if (profiles.length > 1) {
            console.warn(`[Webhook] Multiple profiles found for customer: ${customerId}`);
          }
          
          // Use the first profile found
          const userIdFromProfile = profiles[0].userId;
          console.log(`[Webhook] Using userId from profile: ${userIdFromProfile}`);
          
          // Handle plan changes based on subscription status
          if (subscriptionStatus === 'active') {
            console.log(`[Webhook] Subscription ${subscription.id} is active`);
            
            // Check if this is a plan change by looking at subscription items
            if (subscription.items?.data?.length > 0) {
              const currentPriceId = subscription.items.data[0].price.id;
              
              // Determine which plan this price ID corresponds to
              let newPlan: "starter_2024" | "pro_2024" | "business_2024" | "free" = "free";
              
              if (currentPriceId === process.env.STARTER_PRICE_ID) {
                newPlan = "starter_2024";
              } else if (currentPriceId === process.env.PRO_PRICE_ID) {
                newPlan = "pro_2024";
              } else if (currentPriceId === process.env.BUSINESS_PRICE_ID) {
                newPlan = "business_2024";
              }
              
              console.log(`[Webhook] Plan change detected to ${newPlan} (Price ID: ${currentPriceId})`);
              
              // Update the profile with the new plan
              await updateUserCredits(userIdFromProfile, newPlan, customerId, subscription.id);
            }
          } else if (subscriptionStatus === 'canceled' || subscriptionStatus === 'unpaid') {
            // Downgrade to free plan if subscription is canceled
            console.log(`[Webhook] Subscription ${subscription.id} is ${subscriptionStatus}, downgrading to free plan`);
            await updateUserCredits(userIdFromProfile, "free");
          }
          
          break;
        }
        
        // Handle plan changes based on subscription status
        if (subscriptionStatus === 'active') {
          console.log(`[Webhook] Subscription ${subscription.id} is active`);
          
          // Check if this is a plan change by looking at subscription items
          if (subscription.items?.data?.length > 0) {
            const currentPriceId = subscription.items.data[0].price.id;
            
            // Determine which plan this price ID corresponds to
            let newPlan: "starter_2024" | "pro_2024" | "business_2024" | "free" = "free";
            
            if (currentPriceId === process.env.STARTER_PRICE_ID) {
              newPlan = "starter_2024";
            } else if (currentPriceId === process.env.PRO_PRICE_ID) {
              newPlan = "pro_2024";
            } else if (currentPriceId === process.env.BUSINESS_PRICE_ID) {
              newPlan = "business_2024";
            }
            
            console.log(`[Webhook] Plan change detected to ${newPlan} (Price ID: ${currentPriceId})`);
            
            // Update the profile with the new plan
            await updateUserCredits(userId, newPlan, customerId, subscription.id);
          }
        } else if (subscriptionStatus === 'canceled' || subscriptionStatus === 'unpaid') {
          // Downgrade to free plan if subscription is canceled
          console.log(`[Webhook] Subscription ${subscription.id} is ${subscriptionStatus}, downgrading to free plan`);
          await updateUserCredits(userId, "free");
        }
        
        break;
      }

      // Handle monthly subscription payments
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        
        console.log("[Webhook] Invoice payment succeeded:", {
          id: invoice.id,
          subscription: invoice.subscription,
          status: invoice.status,
          customer: invoice.customer
        });
        
        // Only process subscription invoices
        if (invoice.subscription && invoice.status === 'paid') {
          console.log(`[Webhook] Processing paid invoice for subscription: ${invoice.subscription}`);
          
          try {
            // Find the subscription for this invoice
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            
            console.log("[Webhook] Retrieved subscription:", {
              id: subscription.id,
              metadata: subscription.metadata,
              customer: subscription.customer
            });
            
            const userId = subscription.metadata.userId;
            
            if (!userId) {
              console.error("[Webhook] No userId in subscription metadata");
              
              // Try to find profile by customer ID
              const profiles = await db.query.profiles.findMany({
                where: eq(profilesTable.stripeCustomerId, invoice.customer as string)
              });
              
              if (profiles.length === 0) {
                console.error(`[Webhook] No profile found for customer: ${invoice.customer}`);
                break;
              }
              
              if (profiles.length > 1) {
                console.warn(`[Webhook] Multiple profiles found for customer: ${invoice.customer}`);
              }
              
              // Use the first profile found
              const userIdFromProfile = profiles[0].userId;
              console.log(`[Webhook] Using userId from profile: ${userIdFromProfile}`);
              
              // Get current plan for this subscription
              let currentPlan: "starter_2024" | "pro_2024" | "business_2024" | "free" = "free";
              
              if (subscription.items.data.length > 0) {
                const currentPriceId = subscription.items.data[0]?.price.id;
                
                if (currentPriceId === process.env.STARTER_PRICE_ID) {
                  currentPlan = "starter_2024";
                } else if (currentPriceId === process.env.PRO_PRICE_ID) {
                  currentPlan = "pro_2024";
                } else if (currentPriceId === process.env.BUSINESS_PRICE_ID) {
                  currentPlan = "business_2024";
                }
              }
              
              console.log(`[Webhook] Monthly renewal for plan: ${currentPlan}`);
              
              // Reset usage counters for the new billing cycle
              // For renewal, we don't carry over credits - we just reset to the plan values
              await updateProfile(userIdFromProfile, {
                // Reset used fields to zero
                totalResponsesUsed: 0,
                totalInternalChatQueriesUsed: 0,
                totalChatInstanceGenerationsUsed: 0,
                
                // Set quotas to plan values for the new cycle
                totalResponsesQuota: PLAN_RESPONSES[currentPlan],
                totalResponsesAvailable: PLAN_RESPONSES[currentPlan],
                totalInternalChatQueriesQuota: PLAN_INTERNAL_CHAT_QUERIES[currentPlan],
                totalInternalChatQueriesAvailable: PLAN_INTERNAL_CHAT_QUERIES[currentPlan],
                totalChatInstanceGenerationsQuota: PLAN_CHAT_INSTANCE_GENERATIONS[currentPlan],
                totalChatInstanceGenerationsAvailable: PLAN_CHAT_INSTANCE_GENERATIONS[currentPlan],
              });
              
              console.log(`[Webhook] Reset usage counters for user ${userIdFromProfile} - new billing cycle started`);
              break;
            }
            
            // Get current plan for this subscription
            let currentPlan: "starter_2024" | "pro_2024" | "business_2024" | "free" = "free";
            
            if (subscription.items.data.length > 0) {
              const currentPriceId = subscription.items.data[0]?.price.id;
              
              if (currentPriceId === process.env.STARTER_PRICE_ID) {
                currentPlan = "starter_2024";
              } else if (currentPriceId === process.env.PRO_PRICE_ID) {
                currentPlan = "pro_2024";
              } else if (currentPriceId === process.env.BUSINESS_PRICE_ID) {
                currentPlan = "business_2024";
              }
            }
            
            console.log(`[Webhook] Monthly renewal for plan: ${currentPlan}`);
            
            // Reset usage counters for the new billing cycle
            // For renewal, we don't carry over credits - we just reset to the plan values
            await updateProfile(userId, {
              // Reset used fields to zero
              totalResponsesUsed: 0,
              totalInternalChatQueriesUsed: 0,
              totalChatInstanceGenerationsUsed: 0,
              
              // Set quotas to plan values for the new cycle
              totalResponsesQuota: PLAN_RESPONSES[currentPlan],
              totalResponsesAvailable: PLAN_RESPONSES[currentPlan],
              totalInternalChatQueriesQuota: PLAN_INTERNAL_CHAT_QUERIES[currentPlan],
              totalInternalChatQueriesAvailable: PLAN_INTERNAL_CHAT_QUERIES[currentPlan],
              totalChatInstanceGenerationsQuota: PLAN_CHAT_INSTANCE_GENERATIONS[currentPlan],
              totalChatInstanceGenerationsAvailable: PLAN_CHAT_INSTANCE_GENERATIONS[currentPlan],
            });
            
            console.log(`[Webhook] Reset usage counters for user ${userId} - new billing cycle started`);
          } catch (error) {
            console.error("[Webhook] Error processing invoice payment:", error);
          }
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
} 