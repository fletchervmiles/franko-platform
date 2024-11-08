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