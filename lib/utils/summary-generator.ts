/**
 * Summary Generator Utility
 * 
 * Generates a structured JSON summary of a conversation using the AI SDK with Gemini Pro or Gemini Flash model.
 * Skips generation if the completion rate is 0%.
 */

import { readFileSync } from 'fs';
import path from 'path';
import { generateText } from "ai";
import { logger } from "@/lib/logger";
import { 
  geminiFlashModel, 
  gemini25ProPreviewModel // Import the new model
} from "@/ai_folder";

/**
 * Generates a structured JSON summary of a conversation using the AI SDK
 * 
 * @param cleanTranscript - The cleaned transcript of the conversation
 * @param conversationPlan - The conversation plan as a string or object
 * @param completionRate - The completion rate as a number or string
 * @returns Promise resolving to the generated JSON summary as a string
 */
export async function generateSummary(
  cleanTranscript: string,
  conversationPlan: string | Record<string, unknown>,
  completionRate: number | string
): Promise<string> {
  try {
    // Parse the completion rate if it's a string
    let rate: number;
    
    if (typeof completionRate === 'string') {
      // Remove the % sign and convert to number
      rate = parseInt(completionRate.replace('%', ''), 10);
    } else {
      rate = completionRate;
    }
    
    // Skip if completion rate is 0%
    if (isNaN(rate) || rate === 0) {
      logger.debug('Skipping summary generation, completion rate is 0%');
      return '';
    }
    
    // Make sure cleanTranscript is a string
    if (!cleanTranscript || typeof cleanTranscript !== 'string') {
      logger.warn('Clean transcript is empty or not a string', { 
        type: typeof cleanTranscript,
        length: cleanTranscript ? String(cleanTranscript).length : 0
      });
      return 'Summary unavailable: Transcript is empty or invalid.';
    }
    
    // Convert conversation plan to string if it's an object
    const planString = typeof conversationPlan === 'object' 
      ? JSON.stringify(conversationPlan, null, 2) 
      : conversationPlan;
    
    // Read the prompt template
    const promptTemplate = getPromptTemplate();
    
    // Replace placeholders with actual values
    const systemPrompt = promptTemplate
      .replace('{cleaned_transcript}', cleanTranscript)
      .replace('{conversation_plan}', planString);
    
    // Add retry logic with primary and fallback models
    const maxRetries = 2;
    let retryCount = 0;
    let lastError: any = null;
    
    while (retryCount < maxRetries) {
      try {
        logger.debug(`Generating summary attempt ${retryCount + 1}`, { 
          model: retryCount === 0 ? 'gemini25ProPreviewModel' : 'geminiFlashModel',
          transcriptLength: cleanTranscript.length,
          planLength: planString.length
        });
        
        // Use the AI SDK generateText function - try Gemini Pro Preview first, then Flash as fallback
        const response = await generateText({
          model: retryCount === 0 ? gemini25ProPreviewModel : geminiFlashModel,
          system: systemPrompt,
          prompt: "",
          temperature: 0.7,
          maxTokens: 10000,
        });
        
        const summary = response.text || "";
        const finishReason = response.finishReason;
        const completionTokens = response.usage.completionTokens;

        logger.debug('[summary-generator] AI response details', {
          finishReason,
          completionTokens,
          model: retryCount === 0 ? 'gemini25ProPreviewModel' : 'geminiFlashModel',
        });
        
        if (!summary.trim()) {
          logger.warn('[summary-generator] Empty summary returned by model.', { finishReason, completionTokens });
          throw new Error("Empty summary returned");
        }
        
        // Check for potentially truncated summary
        if (summary.trim().length < 50) {
          logger.warn('[summary-generator] Potentially truncated summary: length is less than 50 characters.', { 
            summaryLength: summary.trim().length, 
            summaryContent: summary.trim(),
            finishReason,
            completionTokens
          });
        }

        logger.debug('Summary generated successfully', { 
          model: retryCount === 0 ? 'gemini25ProPreviewModel' : 'geminiFlashModel',
          summaryLength: summary.length,
          finishReason,
          completionTokens
        });
        
        return summary;
      } catch (error) {
        lastError = error;
        logger.warn(`Summary generation attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        
        // If we've reached max retries, return a fallback message
        if (retryCount >= maxRetries) {
          logger.error('All summary generation attempts failed:', { error: lastError });
          return 'Summary generation failed. Please check the transcript for details.';
        }
        
        // Simple backoff before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // This should never be reached due to the return in the retry loop
    return 'Summary generation failed.';
  } catch (error) {
    logger.error('Error in summary generation process:', error);
    return 'Error generating summary. Please check the transcript for details.';
  }
}

/**
 * Gets the prompt template from the file system
 * 
 * @returns The prompt template as a string
 */
function getPromptTemplate(): string {
  try {
    // Try to load the prompt template from the file system
    const promptPath = path.join(process.cwd(), 'agent_prompts', 'post_chat_json_summary.md');
    
    try {
      return readFileSync(promptPath, 'utf-8');
    } catch (fileError) {
      // If the file doesn't exist or can't be read, return a default prompt
      logger.warn('Could not read post_chat_json_summary.md, using default prompt', { error: fileError });
      
      return `
# High-Signal Story-Arc Summary

## ROLE
You are a senior product-market-fit researcher.
Return **only** a valid JSON object that conforms to the schema below.
No explanations, markdown, or extra keys.

## INPUTS
1.  \`conversation_plan\` – reveals the interview intent
2.  \`cleaned_transcript\` – full dialogue (ground truth)

## OUTPUT SCHEMA
\`\`\`json
{
  "execSummary": string,
  "storyArc": [
    {
      "label": string,
      "insight": string,             // ≤ 25 words
      "quote": string,
      "signal": "high"|"medium"|"low"
    }
  ],
  "sentiment": {
    "value": "positive"|"neutral"|"negative"|null,
    "snippet": string|null
  },
  "featureSignals": [string, ...] | null,
  "evaluation": {
    "strength": "high"|"medium"|"low",
    "comment": string                      // ≤ 30 words
  }
}
\`\`\`

## conversation_plan
{conversation_plan}

## Interview Transcript
{cleaned_transcript}

## YOUR OUTPUT
Produce the JSON now.
`;
    }
  } catch (error) {
    logger.error('Error getting prompt template:', error);
    throw error;
  }
}