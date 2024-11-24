import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { getProfileByUserId, updateProfile } from "@/db/queries/profiles-queries";
import { PLAN_MINUTES, type MembershipTier } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(req: Request) {
  try {
    if (!stripe) {
      throw new Error("Stripe is not properly initialized");
    }

    const body = await req.text();
    const signature = headers().get("Stripe-Signature");
    
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return new Response("Missing signature or webhook secret", { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("Received webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as MembershipTier;
        
        console.log("Webhook received session:", {
          userId,
          plan,
          customer: session.customer,
          subscription: session.subscription,
        });

        if (!userId || !plan) {
          console.error("Missing userId or plan in session metadata:", session);
          throw new Error("Missing userId or plan in session metadata");
        }

        if (!session.subscription) {
          console.error("No subscription ID in session");
          throw new Error("No subscription ID found in session");
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        
        console.log("Retrieved subscription:", {
          id: subscription.id,
          status: subscription.status,
        });

        await updateProfile(userId, {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
          membership: plan,
          monthlyMinutes: PLAN_MINUTES[plan],
          minutesAvailable: PLAN_MINUTES[plan],
        });

        console.log("Profile updated successfully with subscription ID:", subscription.id);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Get the userId from the customer metadata
        const customer = await stripe.customers.retrieve(customerId);
        if ('deleted' in customer) {
          throw new Error("Customer has been deleted");
        }
        const userId = customer.metadata.userId;
        
        if (!userId) {
          throw new Error("No userId found in customer metadata");
        }

        // Determine the plan from the subscription
        const planId = subscription.items.data[0]?.price.id;
        const plan = planId === process.env.STRIPE_PRO_PRICE_ID ? "pro" : "starter";

        await updateProfile(userId, {
          membership: plan as MembershipTier,
          monthlyMinutes: PLAN_MINUTES[plan],
          minutesAvailable: PLAN_MINUTES[plan], // Reset available minutes on plan change
          stripeSubscriptionId: subscription.id
        });

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Get the userId from the customer metadata
        const customer = await stripe.customers.retrieve(customerId);
        if ('deleted' in customer) {
          throw new Error("Customer has been deleted");
        }
        const userId = customer.metadata.userId;
        
        if (!userId) {
          throw new Error("No userId found in customer metadata");
        }

        // Reset to free plan
        await updateProfile(userId, {
          membership: "free",
          monthlyMinutes: PLAN_MINUTES.free,
          minutesAvailable: PLAN_MINUTES.free,
          stripeSubscriptionId: null,
        });

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