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
  apiVersion: "2024-11-20.acacia", // Specify Stripe API version
  typescript: true,                 // Enable TypeScript support
});

/**
 * Type Definitions
 * Purpose: Define membership tiers and related types for the application
 */

// Define all possible membership tiers including legacy and current plans
export type MembershipTier = "free" | "starter" | "pro" | "starter_2024" | "pro_2024";

// Define database-specific membership tiers (simplified version without year variants)
export type DBMembershipTier = "free" | "starter" | "pro";

// Define monthly minute allocations for each membership tier
export const PLAN_MINUTES = {
  free: 0,           // Free tier with no minutes
  starter: 200,      // Legacy starter plan
  pro: 500,          // Legacy pro plan
  starter_2024: 100, // Current starter plan
  pro_2024: 250      // Current pro plan
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
  monthlyMinutes: number;  // Allocated minutes per month
}