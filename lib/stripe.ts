import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}


export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

export type MembershipTier = "free" | "starter" | "pro";

export const PLAN_MINUTES = {
  free: 0,
  starter: 200,
  pro: 500
} as const;

export interface StripeSubscriptionData {
  customerId: string;
  subscriptionId: string;
  membershipTier: MembershipTier;
  monthlyMinutes: number;
}