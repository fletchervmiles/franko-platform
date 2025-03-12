/**
 * Sanitizes database objects to prevent circular reference errors when using JSON.stringify
 * Recursively removes properties that typically cause circular references (like 'table')
 * and creates a safe-to-serialize copy of the data
 */
export function sanitizeDbObject(obj: any): any {
  // Handle null or undefined
  if (obj == null) return null;
  
  // Handle primitives
  if (typeof obj !== 'object') return obj;
  
  // Handle arrays - recursively sanitize each element
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeDbObject(item));
  }
  
  // For objects, create a clean copy without circular references
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip properties that might cause circular references or functions
    if (key !== 'table' && typeof value !== 'function') {
      // Recursively sanitize object properties
      result[key] = typeof value === 'object' ? sanitizeDbObject(value) : value;
    }
  }
  
  return result;
}

/**
 * A shorter version of sanitizeDbObject specifically for logging
 * This can be used as a quick wrapper around JSON.stringify
 */
export function safeStringify(obj: any): string {
  return JSON.stringify(sanitizeDbObject(obj));
} 