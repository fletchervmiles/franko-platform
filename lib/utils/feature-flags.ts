/**
 * Feature flag control center for the application
 * Use this to safely toggle features on and off
 */

export const FEATURES = {
  // Controls whether to use the new robust JSON parser
  USE_ROBUST_JSON_PARSER: true,
  
  // Add other feature flags here
};

/**
 * Helper function to check if a feature is enabled
 */
export function isFeatureEnabled(featureName: keyof typeof FEATURES): boolean {
  return FEATURES[featureName] === true;
} 