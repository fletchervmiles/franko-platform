import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { getProfileByUserId, updateProfile } from "@/db/queries/profiles-queries";
import { PLAN_MINUTES, type MembershipTier } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("Stripe-Signature");
    
    console.log("Received webhook request");
    
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Missing signature or webhook secret");
      return new Response("Missing signature or webhook secret", { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("Webhook event type:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log("Full webhook session data:", JSON.stringify({
          id: session.id,
          customer: session.customer,
          subscription: session.subscription,
          metadata: session.metadata,
        }, null, 2));

        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as MembershipTier;
        
        if (!userId) {
          throw new Error("No userId found in session metadata");
        }

        if (!session.subscription) {
          console.error("No subscription found in session:", session.id);
          throw new Error("No subscription ID in session");
        }

        // Get full subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        
        console.log("Retrieved subscription details:", {
          subscriptionId: subscription.id,
          status: subscription.status,
          customerId: subscription.customer,
          plan: subscription.items.data[0]?.price.id
        });

        const updatedProfile = await updateProfile(userId, {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
          membership: plan,
          monthlyMinutes: PLAN_MINUTES[plan],
          minutesAvailable: PLAN_MINUTES[plan],
        });

        console.log("Updated profile result:", updatedProfile);
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