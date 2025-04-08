/**
 * Utility functions for parsing and repairing JSON from AI responses
 */

import json5 from 'json5';
import { parse as parseRelaxedJson } from 'relaxed-json';

/**
 * Dedicated logger for JSON parsing issues
 * This helps to centralize and standardize logging of JSON parse errors
 */
export function logJsonParseError(stage: string, error: any, content?: string): void {
  console.error(`JSON Parse Error (${stage}):`, {
    message: error?.message || 'Unknown error',
    name: error?.name,
    stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    contentPreview: content 
      ? `${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`
      : '[No content]',
    contentLength: content?.length || 0,
    hasJsonMarkers: content?.includes('```json') || false,
    hasTrailingComma: content?.includes(',}') || content?.includes(',\n}') || content?.includes(', }') || false,
    timestamp: new Date().toISOString()
  });
}

/**
 * Repairs common JSON issues like trailing commas, quote problems, etc.
 */
export function repairCommonJsonIssues(jsonString: string): string {
  // Remove trailing commas in objects and arrays
  let repaired = jsonString.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix missing quotes around keys
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
  
  // Convert single quotes to double quotes (with escaping)
  repaired = repaired.replace(/'([^']*)'(\s*:)/g, '"$1"$2');
  repaired = repaired.replace(/'([^']*)'/g, '"$1"');
  
  // Handle unescaped line breaks in strings
  repaired = repaired.replace(/(".*?)(\n)(.*?")/g, '$1\\n$3');
  
  return repaired;
}

/**
 * Attempts to extract JSON from a string that might be wrapped in other content
 */
export function extractJsonFromString(content: string): string | null {
  // Extract JSON blocks from markdown code blocks
  if (content.includes('```json') && content.includes('```')) {
    const jsonText = content.split('```json\n')[1]?.split('\n```')[0];
    if (jsonText) {
      return jsonText;
    }
  }
  
  // Check if the content itself looks like JSON
  if ((content.trim().startsWith('{') && content.trim().endsWith('}')) || 
      (content.trim().startsWith('[') && content.trim().endsWith(']'))) {
    return content;
  }
  
  return null;
}

/**
 * Tiered approach to parse JSON with increasing flexibility
 */
export function parseRobustJson(content: string): any {
  // Tier 1: Standard JSON.parse()
  try {
    return JSON.parse(content);
  } catch (e) {
    console.log('Standard JSON parse failed, trying repair:', e);
  }

  // Tier 2: Repair and retry
  try {
    const repairedJson = repairCommonJsonIssues(content);
    return JSON.parse(repairedJson);
  } catch (e) {
    console.log('Repaired JSON parse failed, trying JSON5:', e);
  }

  // Tier 3: JSON5 (more tolerant parser)
  try {
    return json5.parse(content);
  } catch (e) {
    console.log('JSON5 parse failed, trying relaxed-json:', e);
  }

  // Tier 4: Relaxed JSON (extremely tolerant)
  try {
    return parseRelaxedJson(content);
  } catch (e) {
    console.log('All JSON parsing methods failed:', e);
    throw new Error('Unable to parse JSON content');
  }
}

/**
 * Extract a specific field from JSON using regex as last resort
 */
export function extractFieldWithRegex(content: string, fieldName: string): string | null {
  const regex = new RegExp(`"${fieldName}"\\s*:\\s*"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"`, 's');
  const matches = content.match(regex);
  if (matches && matches[1]) {
    return matches[1].replace(/\\"/g, '"');
  }
  return null;
}

/**
 * Main function that attempts to extract a response field from content
 * using all available methods
 */
export function extractResponseFromAIOutput(
  content: any, 
  fallbackField: string = 'response',
  defaultErrorMessage?: string
): string {
  // If not a string, convert to string
  if (typeof content !== 'string') {
    return String(content);
  }

  // If content doesn't look like JSON, return it directly
  const trimmedContent = content.trim();
  const looksLikeJson = 
    content.includes('```json') || 
    (trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) || 
    (trimmedContent.startsWith('[') && trimmedContent.endsWith('}]'));

  if (!looksLikeJson) {
    console.log('Content does not look like JSON, returning directly.');
    return content; // Return the plain text content as is
  }

  // Try to extract JSON if content is wrapped
  const jsonContent = extractJsonFromString(content) || content;
  
  // Try parsing with our robust parser
  try {
    const parsed = parseRobustJson(jsonContent);
    if (parsed[fallbackField]) {
      return parsed[fallbackField];
    }
  } catch (e) {
    logJsonParseError('extractResponseFromAIOutput', e, jsonContent);
  }
  
  // Last resort: try regex extraction
  const regexExtracted = extractFieldWithRegex(jsonContent, fallbackField);
  if (regexExtracted) {
    return regexExtracted;
  }
  
  // Check if we should return a custom error message instead of raw content
  if (defaultErrorMessage && 
      // Only use error message if content looks like JSON but failed to parse
      ((content.includes('```json') && content.includes('```')) || 
       content.trim().startsWith('{') || 
       content.trim().startsWith('['))) {
    return defaultErrorMessage;
  }
  
  // Ultimate fallback: return original content
  return content;
}

/**
 * Debugging version that returns additional information about the parsing process
 */
export function extractResponseWithDebug(content: any): { 
  result: string, 
  debugInfo: { method: string, success: boolean, error?: string }
} {
  // If not a string, convert to string
  if (typeof content !== 'string') {
    return {
      result: String(content),
      debugInfo: { method: 'stringify', success: true }
    };
  }

  // Try to extract JSON if content is wrapped
  const jsonContent = extractJsonFromString(content) || content;
  
  // Tier 1: Standard JSON.parse()
  try {
    const parsed = JSON.parse(jsonContent);
    if (parsed.response) {
      return {
        result: parsed.response,
        debugInfo: { method: 'standard', success: true }
      };
    }
  } catch (e) {
    // Continue to next tier
  }

  // Tier 2: Repair and retry
  try {
    const repairedJson = repairCommonJsonIssues(jsonContent);
    const parsed = JSON.parse(repairedJson);
    if (parsed.response) {
      return {
        result: parsed.response,
        debugInfo: { method: 'repaired', success: true }
      };
    }
  } catch (e) {
    // Continue to next tier
  }

  // Tier 3: JSON5
  try {
    const parsed = json5.parse(jsonContent);
    if (parsed.response) {
      return {
        result: parsed.response,
        debugInfo: { method: 'json5', success: true }
      };
    }
  } catch (e) {
    // Continue to next tier
  }

  // Tier 4: Relaxed JSON
  try {
    const parsed = parseRelaxedJson(jsonContent);
    if (parsed.response) {
      return {
        result: parsed.response,
        debugInfo: { method: 'relaxed', success: true }
      };
    }
  } catch (e) {
    // Continue to next tier
  }

  // Tier 5: Regex extraction
  const regexExtracted = extractFieldWithRegex(jsonContent, 'response');
  if (regexExtracted) {
    return {
      result: regexExtracted,
      debugInfo: { method: 'regex', success: true }
    };
  }
  
  // Ultimate fallback: return original content
  return {
    result: content,
    debugInfo: { 
      method: 'fallback', 
      success: false, 
      error: 'All parsing methods failed' 
    }
  };
} 