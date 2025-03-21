import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { getProfileByUserId, updateProfile } from "@/db/queries/profiles-queries";
import { PLAN_RESPONSES, PLAN_INTERNAL_CHAT_QUERIES, PLAN_CHAT_INSTANCE_GENERATIONS, type MembershipTier } from "@/lib/stripe";
import type Stripe from "stripe";
import { mapToDBMembership } from "@/lib/stripe";

// Add type safety for the plan parameter
type UIPlan = "starter" | "pro" | "business";
type InternalPlan = "starter_2024" | "pro_2024" | "business_2024";

// Disable automatic body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("Stripe-Signature");
    
    console.log("Received webhook request");
    
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Missing signature or webhook secret");
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
      console.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

    console.log("Webhook event type:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log("Full webhook session data:", JSON.stringify({
          id: session.id,
          customer: session.customer,
          metadata: session.metadata,
          payment_status: session.payment_status,
          mode: session.mode,
          subscription: session.subscription,
        }, null, 2));

        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as InternalPlan;
        const dbMembership = mapToDBMembership(plan);
        
        if (!userId) {
          throw new Error("No userId found in session metadata");
        }

        // Retrieve the current profile to calculate remaining credits
        const currentProfile = await getProfileByUserId(userId);
        
        // Calculate remaining credits and prepare update data
        const updatedProfile: Record<string, any> = {
          stripeCustomerId: session.customer as string,
          membership: dbMembership,
        };

        if (session.mode === 'subscription' && session.subscription) {
          updatedProfile.stripeSubscriptionId = session.subscription as string;
          console.log(`Adding subscription ID: ${session.subscription}`);
        }

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
          
          console.log("Remaining credits calculated:", {
            responseCreditsRemaining,
            chatQueryCreditsRemaining,
            chatInstanceCreditsRemaining
          });
          
          // Step 2: Reset used fields to zero
          updatedProfile.totalResponsesUsed = 0;
          updatedProfile.totalInternalChatQueriesUsed = 0;
          updatedProfile.totalChatInstanceGenerationsUsed = 0;
          
          // Step 3: Set quota to new plan allocation + remaining credits
          updatedProfile.totalResponsesQuota = PLAN_RESPONSES[plan] + responseCreditsRemaining;
          updatedProfile.totalResponsesAvailable = PLAN_RESPONSES[plan] + responseCreditsRemaining;
          
          updatedProfile.totalInternalChatQueriesQuota = PLAN_INTERNAL_CHAT_QUERIES[plan] + chatQueryCreditsRemaining;
          updatedProfile.totalInternalChatQueriesAvailable = PLAN_INTERNAL_CHAT_QUERIES[plan] + chatQueryCreditsRemaining;
          
          updatedProfile.totalChatInstanceGenerationsQuota = PLAN_CHAT_INSTANCE_GENERATIONS[plan] + chatInstanceCreditsRemaining;
          updatedProfile.totalChatInstanceGenerationsAvailable = PLAN_CHAT_INSTANCE_GENERATIONS[plan] + chatInstanceCreditsRemaining;
        } else {
          // For new users, set quotas directly from plan
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

        // Update the profile with carried-over credits
        await updateProfile(userId, updatedProfile);
        console.log("Profile updated with carried-over credits:", updatedProfile);
        
        break;
      }

      // Handle subscription updates
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subscriptionStatus = subscription.status;
        
        // Find the profile with this customer ID
        const profile = await getProfileByUserId(subscription.metadata.userId || "");
        
        if (!profile) {
          console.error(`No profile found for subscription: ${subscription.id}`);
          break;
        }

        // Handle plan changes
        if (subscriptionStatus === 'active') {
          console.log(`Subscription ${subscription.id} is active`);
          
          // Check if this is a plan change by looking at subscription items
          if (subscription.items?.data?.length > 0) {
            const currentPriceId = subscription.items.data[0].price.id;
            
            // Determine which plan this price ID corresponds to
            let newPlan: "starter_2024" | "pro_2024" | "business_2024" | null = null;
            
            if (currentPriceId === process.env.STARTER_PRICE_ID) {
              newPlan = "starter_2024";
            } else if (currentPriceId === process.env.PRO_PRICE_ID) {
              newPlan = "pro_2024";
            } else if (currentPriceId === process.env.BUSINESS_PRICE_ID) {
              newPlan = "business_2024";
            }
            
            if (newPlan) {
              console.log(`Plan change detected for subscription ${subscription.id} to ${newPlan}`);
              
              const dbMembership = mapToDBMembership(newPlan);
              
              // Step 1: Calculate remaining credits
              const responseCreditsRemaining = Math.max(0, 
                (profile.totalResponsesQuota || 0) - (profile.totalResponsesUsed || 0)
              );
              
              const chatQueryCreditsRemaining = Math.max(0, 
                (profile.totalInternalChatQueriesQuota || 0) - (profile.totalInternalChatQueriesUsed || 0)
              );
              
              const chatInstanceCreditsRemaining = Math.max(0, 
                (profile.totalChatInstanceGenerationsQuota || 0) - (profile.totalChatInstanceGenerationsUsed || 0)
              );
              
              console.log("Remaining credits calculated:", {
                responseCreditsRemaining,
                chatQueryCreditsRemaining,
                chatInstanceCreditsRemaining
              });
              
              // Update profile with carried-over credits
              await updateProfile(profile.userId, {
                membership: dbMembership,
                
                // Step 2: Reset used fields to zero
                totalResponsesUsed: 0,
                totalInternalChatQueriesUsed: 0,
                totalChatInstanceGenerationsUsed: 0,
                
                // Step 3: Set quota to new plan allocation + remaining credits
                totalResponsesQuota: PLAN_RESPONSES[newPlan] + responseCreditsRemaining,
                totalResponsesAvailable: PLAN_RESPONSES[newPlan] + responseCreditsRemaining,
                
                totalInternalChatQueriesQuota: PLAN_INTERNAL_CHAT_QUERIES[newPlan] + chatQueryCreditsRemaining,
                totalInternalChatQueriesAvailable: PLAN_INTERNAL_CHAT_QUERIES[newPlan] + chatQueryCreditsRemaining,
                
                totalChatInstanceGenerationsQuota: PLAN_CHAT_INSTANCE_GENERATIONS[newPlan] + chatInstanceCreditsRemaining,
                totalChatInstanceGenerationsAvailable: PLAN_CHAT_INSTANCE_GENERATIONS[newPlan] + chatInstanceCreditsRemaining,
              });
              
              console.log(`Profile updated for subscription ${subscription.id} with carried-over credits`);
            }
          }
        } else if (subscriptionStatus === 'canceled' || subscriptionStatus === 'unpaid') {
          // Downgrade to free plan if subscription is canceled
          console.log(`Subscription ${subscription.id} is ${subscriptionStatus}, downgrading to free plan`);
          await updateProfile(profile.userId, {
            membership: "free",
            totalResponsesQuota: PLAN_RESPONSES.free,
            totalResponsesAvailable: PLAN_RESPONSES.free,
            totalResponsesUsed: 0,
            totalInternalChatQueriesQuota: PLAN_INTERNAL_CHAT_QUERIES.free,
            totalInternalChatQueriesAvailable: PLAN_INTERNAL_CHAT_QUERIES.free,
            totalInternalChatQueriesUsed: 0,
            totalChatInstanceGenerationsQuota: PLAN_CHAT_INSTANCE_GENERATIONS.free,
            totalChatInstanceGenerationsAvailable: PLAN_CHAT_INSTANCE_GENERATIONS.free,
            totalChatInstanceGenerationsUsed: 0,
          });
        }
        break;
      }

      // Handle monthly subscription payments
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Only process subscription invoices
        if (invoice.subscription && invoice.status === 'paid') {
          console.log(`Processing paid invoice for subscription: ${invoice.subscription}`);
          
          try {
            // Find the customer for this invoice
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            
            if (!subscription.metadata.userId) {
              console.error("No userId in subscription metadata");
              break;
            }
            
            const userId = subscription.metadata.userId;
            const profile = await getProfileByUserId(userId);
            
            if (!profile) {
              console.error(`No profile found for subscription: ${invoice.subscription}`);
              break;
            }
            
            // Get current plan for this subscription
            let currentPlan: "starter_2024" | "pro_2024" | "business_2024" | null = null;
            const currentPriceId = subscription.items.data[0]?.price.id;
            
            if (currentPriceId === process.env.STARTER_PRICE_ID) {
              currentPlan = "starter_2024";
            } else if (currentPriceId === process.env.PRO_PRICE_ID) {
              currentPlan = "pro_2024";
            } else if (currentPriceId === process.env.BUSINESS_PRICE_ID) {
              currentPlan = "business_2024";
            }
            
            if (!currentPlan) {
              console.error(`Unknown price ID: ${currentPriceId}`);
              break;
            }
            
            // Reset usage counters for the new billing cycle
            await updateProfile(userId, {
              // Reset used fields to zero
              totalResponsesUsed: 0,
              totalInternalChatQueriesUsed: 0,
              totalChatInstanceGenerationsUsed: 0,
              
              // Ensure quotas are set to plan values (in case they were altered)
              totalResponsesQuota: PLAN_RESPONSES[currentPlan],
              totalResponsesAvailable: PLAN_RESPONSES[currentPlan],
              totalInternalChatQueriesQuota: PLAN_INTERNAL_CHAT_QUERIES[currentPlan],
              totalInternalChatQueriesAvailable: PLAN_INTERNAL_CHAT_QUERIES[currentPlan],
              totalChatInstanceGenerationsQuota: PLAN_CHAT_INSTANCE_GENERATIONS[currentPlan],
              totalChatInstanceGenerationsAvailable: PLAN_CHAT_INSTANCE_GENERATIONS[currentPlan],
            });
            
            console.log(`Reset usage counters for user ${userId} - new billing cycle started`);
          } catch (error) {
            console.error("Error processing invoice payment:", error);
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
    console.error('Webhook error:', error);
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