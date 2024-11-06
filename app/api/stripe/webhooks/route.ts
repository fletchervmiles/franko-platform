// Import necessary functions and modules for handling Stripe webhooks
import { manageSubscriptionStatusChange, updateStripeCustomer } from "@/actions/stripe-actions";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import Stripe from "stripe";
import StripeError from "stripe";

// Define a set of relevant Stripe event types that this webhook will handle
const relevantEvents = new Set(["checkout.session.completed", "customer.subscription.updated", "customer.subscription.deleted"]);

// Define the POST route handler for incoming Stripe webhook events
export async function POST(req: Request) {
  // Extract the raw body from the request
  const body = await req.text();
  // Get the Stripe signature from the request headers
  const sig = headers().get("Stripe-Signature") as string;
  // Retrieve the Stripe webhook secret from environment variables
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  // Declare a variable to store the parsed Stripe event
  let event: Stripe.Event;

  try {
    // Check if the signature or webhook secret is missing
    if (!sig || !webhookSecret) {
      throw new Error("Webhook secret or signature missing");
    }

    // Construct and verify the Stripe event using the webhook secret
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error(`Webhook Error: ${errorMessage}`);
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  // Check if the event type is one we're interested in handling
  if (relevantEvents.has(event.type)) {
    try {
      // Handle different event types
      switch (event.type) {
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          // Handle subscription changes
          await handleSubscriptionChange(event);
          break;

        case "checkout.session.completed":
          // Handle completed checkout sessions
          await handleCheckoutSession(event);
          break;

        default:
          // Throw an error for unhandled event types
          throw new Error("Unhandled relevant event!");
      }
    } catch (error) {
      // Log and return an error response if event handling fails
      console.error("Webhook handler failed:", error);
      return new Response("Webhook handler failed. View your nextjs function logs.", {
        status: 400
      });
    }
  }

  // Return a success response if the event was handled successfully
  return new Response(JSON.stringify({ received: true }));
}

// Function to handle subscription change events
async function handleSubscriptionChange(event: Stripe.Event) {
  // Extract the subscription object from the event data
  const subscription = event.data.object as Stripe.Subscription;
  // Get the product ID associated with the subscription
  const productId = subscription.items.data[0].price.product as string;
  // Update the subscription status in our system
  await manageSubscriptionStatusChange(subscription.id, subscription.customer as string, productId);
}

// Function to handle completed checkout session events
async function handleCheckoutSession(event: Stripe.Event) {
  // Extract the checkout session object from the event data
  const checkoutSession = event.data.object as Stripe.Checkout.Session;
  // Check if the session is for a subscription
  if (checkoutSession.mode === "subscription") {
    // Get the subscription ID from the session
    const subscriptionId = checkoutSession.subscription as string;
    // Update the customer information in our system
    await updateStripeCustomer(checkoutSession.client_reference_id as string, subscriptionId, checkoutSession.customer as string);

    // Retrieve the full subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["default_payment_method"]
    });

    // Get the product ID associated with the subscription
    const productId = subscription.items.data[0].price.product as string;
    // Update the subscription status in our system
    await manageSubscriptionStatusChange(subscription.id, subscription.customer as string, productId);
  }
}