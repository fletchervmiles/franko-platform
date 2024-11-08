import Stripe from "stripe";

// More defensive initialization
const initializeStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  
  if (!key) {
    console.error('Stripe configuration error:', {
      hasKey: !!process.env.STRIPE_SECRET_KEY,
      env: process.env.NODE_ENV,
      availableEnvVars: Object.keys(process.env).filter(k => k.includes('STRIPE'))
    });
    return null;
  }

  return new Stripe(key, {
    apiVersion: "2024-10-28.acacia",
    typescript: true,
  });
};

export const stripe = initializeStripe();

// Add a check for stripe instance
if (!stripe) {
  throw new Error('Failed to initialize Stripe - check your environment variables');
}