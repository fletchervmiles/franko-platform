/**
 * Logging Configuration
 * 
 * This file contains centralized configuration for all logging in the application.
 * Toggle specific log types on/off by changing the boolean values.
 * 
 * You can also use environment variables to override these settings:
 * - LOG_LEVEL: 'debug', 'info', 'error', or 'none'
 * - LOG_AI_DETAILS: 'true' or 'false'
 * - LOG_API_REQUESTS: 'true' or 'false'
 * - LOG_PROFILE_UPDATES: 'true' or 'false'
 */

// Default log levels - change these values to enable/disable specific log types
const DEFAULT_CONFIG = {
  // Standard log levels
  debug: false,      // Detailed debug information
  info: true,        // General information about application flow
  error: true,       // Error events that might still allow the application to continue
  
  // Special log categories
  ai: false,         // AI-related logs (prompts, responses, etc.)
  apiRequests: false, // API request/response details
  profileUpdates: false, // Profile update notifications
};

// Read environment variables to override defaults
function getEnvBoolean(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

// Parse LOG_LEVEL environment variable
function getLogLevelFromEnv(): Partial<typeof DEFAULT_CONFIG> {
  const logLevel = process.env.LOG_LEVEL?.toLowerCase();
  if (!logLevel) return {};
  
  switch (logLevel) {
    case 'debug':
      return { debug: true, info: true, error: true };
    case 'info':
      return { debug: false, info: true, error: true };
    case 'error':
      return { debug: false, info: false, error: true };
    case 'none':
      return { debug: false, info: false, error: false };
    default:
      return {};
  }
}

// Combine default config with environment variables
export const logConfig = {
  ...DEFAULT_CONFIG,
  ...getLogLevelFromEnv(),
  ai: getEnvBoolean('LOG_AI_DETAILS', DEFAULT_CONFIG.ai),
  apiRequests: getEnvBoolean('LOG_API_REQUESTS', DEFAULT_CONFIG.apiRequests),
  profileUpdates: getEnvBoolean('LOG_PROFILE_UPDATES', DEFAULT_CONFIG.profileUpdates),
};

// Export individual settings for convenience
export const { debug, info, error, ai, apiRequests, profileUpdates } = logConfig; 