const shouldLog = () => {
  // Local development
  if (process.env.NODE_ENV === 'development') return true;
  
  // Vercel preview deployments (staging)
  if (process.env.VERCEL_ENV === 'preview') return true;
  
  // Custom env var approach (alternative/backup)
  if (process.env.ENVIRONMENT === 'staging' || process.env.ENVIRONMENT === 'preview') return true;
  
  // Production (main branch) - no logs
  return false;
}

export const logger = {
  log: (...args: any[]) => shouldLog() && console.log(...args),
  error: (...args: any[]) => shouldLog() && console.error(...args),
  warn: (...args: any[]) => shouldLog() && console.warn(...args),
} 