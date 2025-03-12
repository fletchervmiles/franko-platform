import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { getProfileByUserId, updateProfile } from "@/db/queries/profiles-queries";
import { PLAN_RESPONSES, type MembershipTier } from "@/lib/stripe";
import type Stripe from "stripe";
import { mapToDBMembership } from "@/lib/stripe";

// Add type safety for the plan parameter
type UIPlan = "starter" | "pro";
type InternalPlan = "starter_2024" | "pro_2024";

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
          metadata: session.metadata,
          payment_status: session.payment_status,
        }, null, 2));

        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as InternalPlan;
        const dbMembership = mapToDBMembership(plan);
        
        if (!userId) {
          throw new Error("No userId found in session metadata");
        }

        // Only proceed if payment was successful
        if (session.payment_status !== 'paid') {
          console.log("Payment not completed:", session.payment_status);
          break;
        }

        const updatedProfile = await updateProfile(userId, {
          stripeCustomerId: session.customer as string,
          membership: dbMembership,
          totalResponsesQuota: PLAN_RESPONSES[plan],
          totalResponsesAvailable: PLAN_RESPONSES[plan],
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