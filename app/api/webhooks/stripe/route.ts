import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { getProfileByUserId, updateProfile } from "@/db/queries/profiles-queries";
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
        const userId = session.client_reference_id;
        const plan = session.metadata?.plan as "starter" | "pro";
        
        if (!userId || !plan) {
          console.error("Missing userId or plan in session metadata:", session);
          throw new Error("Missing userId or plan in session metadata");
        }

        // Verify profile exists
        const profile = await getProfileByUserId(userId);
        if (!profile) {
          console.error("Profile not found for userId:", userId);
          throw new Error("Profile not found");
        }

        console.log("Updating profile for user:", userId, "with plan:", plan);

        await updateProfile(userId, {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          membership: plan,
          monthlyMinutes: plan === "pro" ? 500 : 200,
          minutesAvailable: plan === "pro" ? 500 : 200,
        });

        console.log("Profile updated successfully");
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        // Handle subscription updates
        // You might want to update minutesAvailable or membership status
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        // Handle subscription cancellation
        // Update membership to 'free' and reset minutes
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      `Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 400 }
    );
  }
}