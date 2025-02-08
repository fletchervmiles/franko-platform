/**
 * Migration Instructions
 * ====================
 * 
 * Dependencies Required:
 * - @tavily/core: For web search functionality
 * - @vercel/blob: For file handling
 * - ai: For generateObject and streamObject utilities
 * - zod: For schema validation
 * - path, fs: Node.js built-in modules
 * 
 * Environment Variables Needed:
 * - TAVILY_API_KEY: Required for web search
 * - GEMINI_API_KEY: Required for AI model
 * 
 * Integration Points:
 * 1. AI Model Configuration:
 *    - Ensure geminiFlashModel is properly configured in your AI setup
 *    - Update model configuration if using different provider
 * 
 * 2. Prompt Files:
 *    - Create 'agent_prompts' directory in project root
 *    - Add required prompt files (e.g., interview_guide_creator.md)
 * 
 * 3. Type Definitions:
 *    - Ensure CoreMessage type from 'ai' package is available
 *    - Add any custom type definitions used in your schemas
 * 
 * 4. Error Handling:
 *    - Implement error logging strategy
 *    - Add error boundaries in React components using these functions
 * 
 * Common Pitfalls:
 * - Ensure proper path resolution for prompt files in production
 * - Handle rate limiting for Tavily API calls
 * - Validate AI model responses against schemas
 * - Handle streaming responses appropriately in UI
 * 
 * Security Considerations:
 * - Protect API keys in environment variables
 * - Validate user input before passing to AI model
 * - Implement request rate limiting
 * - Add authentication checks before expensive operations
 */

/**
 * Flight Booking Action Generators
 * 
 * This file contains utility functions for generating sample flight-related data
 * including flight status, search results, seat selections, and pricing.
 * These functions use the Gemini Flash model to generate realistic mock data
 * for demonstration purposes.
 */

// Import required dependencies for object generation and schema validation
import { generateObject, streamObject } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";
import { CoreMessage } from "ai";
import path from 'path';
import fs from 'fs';

// Import the AI model configuration
import { geminiFlashModel } from ".";


function loadPrompt(filename: string): string {
  const promptPath = path.join(process.cwd(), 'agent_prompts', filename);
  try {
    return fs.readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.error(`Error loading prompt file: ${filename}`, error);
    throw new Error(`Failed to load prompt file: ${filename}`);
  }
}


export async function performWebSearch({ query }: { query: string }) {
  try {
    // Initialize Tavily client
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
    
    // Use searchQNA for AI-optimized responses
    const results = await tvly.search(query, {
      searchDepth: "basic",
      includeAnswer: true,
      maxResults: 3
    });
    
    return {
      answer: results.answer,
      results: results.results.map(result => ({
        title: result.title,
        url: result.url,
        content: result.content,
        score: result.score
      })),
      responseTime: results.responseTime
    };
  } catch (error) {
    console.error('Tavily search failed:', error);
    throw error;
  }
}

export async function generateConversationPlan({ messages }: { messages: CoreMessage[] }) {
  const { object: plan } = await generateObject({
    model: geminiFlashModel,
    system: loadPrompt("interview_guide_creator.md"),
    prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
    schema: z.object({
      title: z.string().describe("Engaging title reflecting the conversation topics"),
      duration: z.string().describe("Estimated duration e.g. '3 minutes'"),
      summary: z.string().describe("Brief overview of key discussion points"),
      objectives: z.array(
        z.object({
          objective: z.string().describe("Specific learning objective based on the conversation"),
          keyLearningOutcome: z.string().describe("Expected outcome from this objective")
        })
      ).describe("Array of learning objectives with their outcomes")
    }),
  });

  return plan;
}

export async function generateDisplayOptions({ text }: { text: string }) {
  const { object: options } = await generateObject({
    model: geminiFlashModel,
    prompt: `Generate display options for: ${text}`,
    schema: z.object({
      text: z.string().describe("Text to display above the options"),
      options: z.array(z.string()).describe("Array of clickable options to display"),
      type: z.literal("options").describe("Type of display")
    }),
  });

  return {
    text: options.text,
    options: options.options,
    type: "options" as const
  };
}
