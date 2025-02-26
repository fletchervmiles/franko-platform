// Import the logging configuration
import { logConfig } from './log-config';

// Create new file for logging utilities
const LOG_PREFIX = '[FLIGHT-CHAT]';
const COLORS = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
} as const;

const formatLog = (color: keyof typeof COLORS, prefix: string, message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const dataStr = data ? 
    '\n' + JSON.stringify(data, null, 2) : 
    '';
  return `${COLORS[color]}${timestamp} ${LOG_PREFIX}${prefix}${COLORS.reset} ${message}${dataStr}`;
};

export const logger = {
  debug: (message: string, data?: unknown) => {
    if (logConfig.debug) {
      console.debug(formatLog('blue', '', message, data));
    }
  },
  
  info: (message: string, data?: unknown) => {
    if (logConfig.info) {
      console.info(formatLog('green', '', message, data));
    }
  },
  
  error: (message: string, error?: unknown) => {
    if (logConfig.error) {
      console.error(formatLog('red', '', message, error));
    }
  },
  
  ai: (message: string, data?: unknown) => {
    if (logConfig.ai) {
      console.log(formatLog('magenta', ' [AI]', message, data));
    }
  },

  // New method for API request logging
  api: (message: string, data?: unknown) => {
    if (logConfig.apiRequests) {
      console.log(formatLog('yellow', ' [API]', message, data));
    }
  },

  // New method for profile updates
  profile: (message: string, data?: unknown) => {
    if (logConfig.profileUpdates) {
      console.log(formatLog('green', ' [PROFILE]', message, data));
    }
  }
}; 