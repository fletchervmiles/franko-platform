// Import the Stripe library which provides tools for payment processing
import Stripe from "stripe";

/* Initialize a new Stripe client instance with our secret key
 * The '!' tells TypeScript we're certain the environment variable exists
 * This client will be used throughout the app for payment operations
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Specify which version of Stripe's API we want to use
  apiVersion: "2024-10-28.acacia",
  // Provide metadata about our application to Stripe
  appInfo: {
    name: "Franko-Platform",    // The name of our application
    version: "0.1.0"     // Current version of our application
  }
});