// Create new file for logging utilities
const LOG_PREFIX = '[FLIGHT-CHAT]';
const COLORS = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
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
    console.debug(formatLog('blue', '', message, data));
  },
  
  info: (message: string, data?: unknown) => {
    console.info(formatLog('green', '', message, data));
  },
  
  error: (message: string, error?: unknown) => {
    console.error(formatLog('red', '', message, error));
  },
  
  ai: (message: string, data?: unknown) => {
    console.log(formatLog('magenta', ' [AI]', message, data));
  }
}; 