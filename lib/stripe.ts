import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

// Internal types for UI/business logic
export type MembershipTier = "free" | "starter" | "pro" | "starter_2024" | "pro_2024";

// Database membership types
export type DBMembershipTier = "free" | "starter" | "pro";

export const PLAN_MINUTES = {
  free: 0,
  starter: 200,
  pro: 500,
  starter_2024: 100,
  pro_2024: 250
} as const;

// Map 2024 plans to database membership types
export function mapToDBMembership(plan: MembershipTier): DBMembershipTier {
  switch (plan) {
    case "starter_2024":
      return "starter";
    case "pro_2024":
      return "pro";
    default:
      return plan as DBMembershipTier;
  }
}

export interface StripeSubscriptionData {
  customerId: string;
  subscriptionId: string;
  membershipTier: MembershipTier;
  monthlyMinutes: number;
}