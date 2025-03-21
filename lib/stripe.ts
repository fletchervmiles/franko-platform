/**
 * Stripe Integration Module
 * 
 * Description: Handles Stripe payment integration and membership tier management
 * Purpose: Provides core Stripe functionality and type definitions for the application
 * Usage: Used across the application for payment processing and membership management
 */

import Stripe from "stripe";

// Validate that the required environment variable is present
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Initialize Stripe client with API configuration
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia", // Specify Stripe API version
  typescript: true,                 // Enable TypeScript support
});

/**
 * Type Definitions
 * Purpose: Define membership tiers and related types for the application
 */

// Define all possible membership tiers including legacy and current plans
export type MembershipTier = "free" | "starter" | "pro" | "business" | "starter_2024" | "pro_2024" | "business_2024";

// Define database-specific membership tiers (simplified version without year variants)
export type DBMembershipTier = "free" | "starter" | "pro" | "business";

// Define monthly response allocations for each membership tier
export const PLAN_RESPONSES = {
  free: 10,            // Free tier with 10 responses
  starter: 40,         // Starter plan with 40 responses
  pro: 100,            // Pro plan with 100 responses
  business: 500,       // Business plan with 500 responses
  starter_2024: 40,    // Current starter plan
  pro_2024: 100,       // Current pro plan
  business_2024: 500   // Current business plan
} as const;

// Define internal chat query quotas for each membership tier
export const PLAN_INTERNAL_CHAT_QUERIES = {
  free: 10,            // Free tier with 10 internal chat queries
  starter: 40,         // Starter plan with 40 internal chat queries
  pro: 100,            // Pro plan with 100 internal chat queries
  business: 500,       // Business plan with 500 internal chat queries
  starter_2024: 40,    // Current starter plan
  pro_2024: 100,       // Current pro plan
  business_2024: 500   // Current business plan
} as const;

// Define chat instance generation quotas for each membership tier
export const PLAN_CHAT_INSTANCE_GENERATIONS = {
  free: 3,             // Free tier with 3 chat instance generations
  starter: 10,         // Starter plan with 10 chat instance generations
  pro: 20,             // Pro plan with 20 chat instance generations
  business: 50,        // Business plan with 50 chat instance generations
  starter_2024: 10,    // Current starter plan
  pro_2024: 20,        // Current pro plan
  business_2024: 50    // Current business plan
} as const;

/**
 * Function: mapToDBMembership
 * Purpose: Maps current membership tiers to their database representation
 * @param plan - The current membership tier to map
 * @returns The corresponding database membership tier
 */
export function mapToDBMembership(plan: MembershipTier): DBMembershipTier {
  switch (plan) {
    case "starter_2024":
      return "starter"; // Map new starter plan to database starter tier
    case "pro_2024":
      return "pro";     // Map new pro plan to database pro tier
    case "business_2024":
      return "business"; // Map new business plan to database business tier
    default:
      return plan as DBMembershipTier; // Return unchanged for legacy plans
  }
}

/**
 * Interface: StripeSubscriptionData
 * Purpose: Defines the structure for Stripe subscription information
 */
export interface StripeSubscriptionData {
  customerId: string;      // Stripe customer identifier
  subscriptionId: string;  // Stripe subscription identifier
  membershipTier: MembershipTier; // User's current membership level
  monthlyResponses: number;  // Allocated responses per month
}