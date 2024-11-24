# Implementation Plan for Integrating Authentication, Subscription Payments


Objective: 

Allow users to sign up and authenticate using Clerk (already implemented)
Process monthly subscription payments using Stripe (semi implemented but changes required)
Track and manage user usage (minutes per month based on their Stripe membership) using Supabase (semi implemented but changes required)
Ensure only authenticated and subscribed users can access paid features (not implemented)
Provide a seamless user flow from registration to payment to usage (not implemented)


## Step 1 - Collect and Store User Details (Clerk)

The first step is to sign up the user, create a profile and save their details. 

This is already being handled by Clerk in the following code:

`actions\profiles-actions.ts`

```typescript
"use server";

import { createProfile, deleteProfile, getAllProfiles, getProfileByUserId, updateProfile } from "@/db/queries/profiles-queries";
import { InsertProfile } from "@/db/schema/profiles-schema";
import { ActionState } from "@/types";
import console from "console";
import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function createProfileAction(data: InsertProfile): Promise<ActionState> {
  try {
    const newProfile = await createProfile(data);
    revalidatePath("/profile");
    return { status: "success", message: "Profile created successfully", data: newProfile };
  } catch (error) {
    return { status: "error", message: "Failed to create profile" };
  }
}

export async function getProfileByUserIdAction(userId: string): Promise<ActionState> {
  try {
    const profile = await getProfileByUserId(userId);
    return { status: "success", message: "Profile retrieved successfully", data: profile };
  } catch (error) {
    return { status: "error", message: "Failed to get profile" };
  }
}

export async function getAllProfilesAction(): Promise<ActionState> {
  try {
    const profiles = await getAllProfiles();
    return { status: "success", message: "Profiles retrieved successfully", data: profiles };
  } catch (error) {
    return { status: "error", message: "Failed to get profiles" };
  }
}

export async function updateProfileAction(userId: string, data: Partial<InsertProfile>): Promise<ActionState> {
  try {
    const updatedProfile = await updateProfile(userId, data);
    revalidatePath("/profile");
    return { status: "success", message: "Profile updated successfully", data: updatedProfile };
  } catch (error) {
    return { status: "error", message: "Failed to update profile" };
  }
}

export async function deleteProfileAction(userId: string): Promise<ActionState> {
  try {
    await deleteProfile(userId);
    revalidatePath("/profile");
    return { status: "success", message: "Profile deleted successfully" };
  } catch (error) {
    return { status: "error", message: "Failed to delete profile" };
  }
}

export async function syncClerkProfileAction(): Promise<ActionState> {
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return { status: "error", message: "No user ID found" };
    }

    const clerk = await clerkClient();
    
    const user = await clerk.users.getUser(userId);
    if (!user) {
      return { status: "error", message: "No user found" };
    }

    const profileData: Partial<InsertProfile> = {
      firstName: user.firstName || undefined,
      secondName: user.lastName || undefined,
      email: user.emailAddresses[0]?.emailAddress || undefined,
    };

    const updatedProfile = await updateProfile(user.id, profileData);
    
    return { 
      status: "success", 
      message: "Profile synced with Clerk", 
      data: updatedProfile 
    };
  } catch (error) {
    console.error("Error syncing profile:", error);
    return { status: "error", message: "Failed to sync profile" };
  }
}
```

And this is the existing profile schema

`db\schema\profiles-schema.ts`

```typescript
import { pgEnum, pgTable, text, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";

export const membershipEnum = pgEnum("membership", ["free", "pro"]);

export const profilesTable = pgTable("profiles", {
  id: uuid("id").defaultRandom().notNull(),
  userId: text("user_id").primaryKey().notNull(),
  email: text("email"),
  companyName: text("company_name"),
  membership: membershipEnum("membership").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  firstName: text("first_name"),
  secondName: text("second_name"),
  companyUrl: text("company_url"),
  companyDescription: text("company_description"),
  companyDescriptionCompleted: boolean("company_description_completed").default(false),
  minutesTotalUsed: integer("minutes_total_used").default(0),
  minutesUsedThisMonth: integer("minutes_used_this_month").default(0),
  minutesAvailable: integer("minutes_available").default(0),
  monthlyMinutes: integer("monthly_minutes").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  agentInterviewerName: text("agent_interviewer_name"),
  voiceId: text("voice_id")
});

export type InsertProfile = typeof profilesTable.$inferInsert;
export type SelectProfile = typeof profilesTable.$inferSelect;


// this defines the profiles table in the database
// it defines the columns and the types of the columns
```

For the sign up page we're just using the Clerk component here:

```typescript
"use client";

import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export default function SignUpPage() {
  const { theme } = useTheme();

  return (
    <SignUp
      forceRedirectUrl="/setup"
      appearance={{ baseTheme: theme === "dark" ? dark : undefined }}
    />
  );
}
```

This will need to be updated to redirect with Stripe. Not sure if it needs to redirect with any specific meta data so we can link it all together later?


Values being added to the Supabase table:

userId
first name
last name
email

Following the completion of the sign up, we want to redirect straight to Stripe.

I will have two payment links. 

One payment link for a starter plan. 
One payment link for pro plan. 

Is it possible to capture this as meta data when they go to the Clerk component and then successfully redirect them to the correct Stripe page? How will this work?


## Step 2 - Redirect to Stripe Payment after Sign-Up

Starter - https://buy.stripe.com/test_4gwdUygW95fDfL2dQS (meta data: membership: starter)
Pro - https://buy.stripe.com/test_7sI7wa35jazXfL28wz (meta data: membership: pro)

The meta data is on the product catalog entry, not the link itself.

I have the following existing Stripe code which is currently working but the two payment links shared are both new.

```typescript
// Import functions to update user profiles in our database
import { updateProfile, updateProfileByStripeCustomerId } from "@/db/queries/profiles-queries";
// Import the type definition for a user's profile
import { SelectProfile } from "@/db/schema";
// Import our configured Stripe instance
import { stripe } from "@/lib/stripe";
// Import Stripe types for TypeScript support
import Stripe from "stripe";
// Import the redirect function from next/navigation
import { redirect } from "next/navigation";

// Define a type alias for membership status using the profile schema type
type MembershipStatus = SelectProfile["membership"];

/**
 * Determines the appropriate membership status based on Stripe subscription status
 * @param status - Current Stripe subscription status
 * @param membership - Current membership level
 * @returns Updated membership status (either keeps current membership or downgrades to free)
 */
const getMembershipStatus = (status: Stripe.Subscription.Status, membership: MembershipStatus): MembershipStatus => {
  // Check the subscription status and return appropriate membership level
  switch (status) {
    // For active or trial subscriptions, keep the current membership level
    case "active":
    case "trialing":
      return membership;
    // For all problem states, downgrade to free membership
    case "canceled":
    case "incomplete":
    case "incomplete_expired":
    case "past_due":
    case "paused":
    case "unpaid":
      return "free";
    // Default to free membership for any unknown status
    default:
      return "free";
  }
};

/**
 * Retrieves detailed subscription information from Stripe
 * Includes expanded payment method details for complete subscription info
 */
const getSubscription = async (subscriptionId: string) => {
  if (!stripe) {
    throw new Error("Stripe is not properly initialized");
  }
  
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["default_payment_method"]
  });
};

/**
 * Updates a user's Stripe customer information in our database
 * Called when a new customer is created or their subscription changes
 */
export const updateStripeCustomer = async (userId: string, subscriptionId: string, customerId: string) => {
  try {
    // Validate that all required parameters are provided
    if (!userId || !subscriptionId || !customerId) {
      throw new Error("Missing required parameters for updateStripeCustomer");
    }

    // Get the latest subscription details from Stripe
    const subscription = await getSubscription(subscriptionId);

    // Update the user's profile with their Stripe information
    const updatedProfile = await updateProfile(userId, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id
    });

    // Verify the profile was updated successfully
    if (!updatedProfile) {
      throw new Error("Failed to update customer profile");
    }

    return updatedProfile;
  } catch (error) {
    // Log and rethrow any errors that occur
    console.error("Error in updateStripeCustomer:", error);
    throw error instanceof Error ? error : new Error("Failed to update Stripe customer");
  }
};

/**
 * Handles subscription status changes from Stripe webhooks
 * Updates the user's membership status based on their subscription state
 */
export const manageSubscriptionStatusChange = async (subscriptionId: string, customerId: string, productId: string): Promise<MembershipStatus> => {
  try {
    // Validate that all required parameters are provided
    if (!subscriptionId || !customerId || !productId) {
      throw new Error("Missing required parameters for manageSubscriptionStatusChange");
    }

    // Get the latest subscription details from Stripe
    const subscription = await getSubscription(subscriptionId);

    // Retrieve the product details to get the membership level
    if (!stripe) {
      throw new Error("Stripe is not properly initialized");
    }
    const product = await stripe.products.retrieve(productId);
    // Extract membership type from product metadata
    const membership = product.metadata.membership as MembershipStatus;
    // Validate the membership type is valid
    if (!["free", "pro"].includes(membership)) {
      throw new Error(`Invalid membership type in product metadata: ${membership}`);
    }

    // Determine the appropriate membership status based on subscription state
    const membershipStatus = getMembershipStatus(subscription.status, membership);

    // Update the user's profile with new subscription and membership information
    await updateProfileByStripeCustomerId(customerId, {
      stripeSubscriptionId: subscription.id,
      membership: membershipStatus
    });

    return membershipStatus;
  } catch (error) {
    // Log and rethrow any errors that occur
    console.error("Error in manageSubscriptionStatusChange:", error);
    throw error instanceof Error ? error : new Error("Failed to update subscription status");
  }
};

/**
 * Creates a Stripe portal session for a user
 * @param stripeCustomerId - The Stripe customer ID of the user
 * @returns The URL of the portal session
 */
export const createStripePortalSession = async (stripeCustomerId: string) => {
  try {
    if (!stripeCustomerId) {
      throw new Error("No Stripe customer ID provided");
    }
    if (!stripe) {
      throw new Error("Stripe is not properly initialized");
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
};
```

```typescript
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
    if (!stripe) {
      throw new Error("Stripe client not initialized");
    }
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
    if (!stripe) {
      throw new Error("Stripe client not initialized");
    }
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["default_payment_method"]
    });

    // Get the product ID associated with the subscription
    const productId = subscription.items.data[0].price.product as string;
    // Update the subscription status in our system
    await manageSubscriptionStatusChange(subscription.id, subscription.customer as string, productId);
  }
}
```

I need to update any routes or webhook in accordance with my new requirements although I think the current code should mostly be sufficient.

## Step 3 - Post-Payment Redirection + Handling Paid (starter and pro) Components

Post-Payment Workflow for Stripe Integration
Redirect After Payment

Once the payment is completed, we want to redirect the user back to the setup page.
This can be configured in Stripe, and it should already handle identifying the user’s account via Clerk authentication.

Updating Usage in the Profiles Database

In our profiles database table, we store values that track customer usage, specifically in terms of minutes allocated per plan.
Here’s how the minutes are allocated based on the plan:
Starter Plan: 200 minutes/month
Pro Plan: 500 minutes/month
When a payment is successfully processed, the corresponding monthly minutes value in the database should be updated to reflect the new plan.

Subscription Reset Logic

For customers on a monthly subscription, their minutes allocation should reset when their subscription renews.
Every time a payment is successful (whether it's an initial payment or a recurring one), we should ensure the monthly minutes are updated accordingly.
Summary of Required Steps

Configure the redirect in Stripe to point back to the setup page.

Use Clerk authentication to associate the payment with the correct user account.
After confirming payment success, update the monthly minutes in the profiles database based on the selected plan.

Implement logic to reset the monthly minutes when the subscription renews.

```typescript
  minutesTotalUsed: integer("minutes_total_used").default(0),
  minutesUsedThisMonth: integer("minutes_used_this_month").default(0),
  minutesAvailable: integer("minutes_available").default(0),
  monthlyMinutes: integer("monthly_minutes").default(0),
```





