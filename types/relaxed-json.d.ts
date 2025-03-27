/**
 * Type declarations for relaxed-json package
 */

declare module 'relaxed-json' {
  /**
   * Parse a string as JSON with more relaxed syntax
   */
  export function parse(text: string, opts?: {
    /** Whether to allow trailing commas in objects and arrays */
    tolerant?: boolean;
    /** Whether to transform keys to camelCase */
    relaxed?: boolean;
    /** Whether to warn about potential issues */
    warnings?: boolean;
  }): any;

  /**
   * Transform a string to valid JSON
   */
  export function transform(text: string): string;
} 