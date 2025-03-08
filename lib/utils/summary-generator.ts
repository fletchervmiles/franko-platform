/**
 * Summary Generator Utility
 * 
 * Generates a summary of a conversation using the AI SDK with Gemini Pro or Gemini Flash model.
 * Skips generation if the completion rate is 0%.
 */

import { readFileSync } from 'fs';
import path from 'path';
import { generateText } from "ai";
import { logger } from "@/lib/logger";
import { geminiProModel, geminiFlashModel } from "@/ai_folder";

/**
 * Generates a summary of a conversation using the AI SDK
 * 
 * @param cleanTranscript - The cleaned transcript of the conversation
 * @param conversationPlan - The conversation plan as a string or object
 * @param completionRate - The completion rate as a number or string
 * @returns Promise resolving to the generated summary
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
      .replace('{clean_transcript}', cleanTranscript)
      .replace('{conversation_plan}', planString);
    
    // Add retry logic with primary and fallback models
    const maxRetries = 2;
    let retryCount = 0;
    let lastError: any = null;
    
    while (retryCount < maxRetries) {
      try {
        logger.debug(`Generating summary attempt ${retryCount + 1}`, { 
          model: retryCount === 0 ? 'geminiProModel' : 'geminiFlashModel',
          transcriptLength: cleanTranscript.length,
          planLength: planString.length
        });
        
        // Use the AI SDK generateText function - try Gemini Pro first, then Flash as fallback
        const response = await generateText({
          model: retryCount === 0 ? geminiProModel : geminiFlashModel,
          system: systemPrompt,
          prompt: "",
          temperature: 0.5,
          maxTokens: 1500,
        });
        
        const summary = response.text || "";
        
        if (!summary.trim()) {
          throw new Error("Empty summary returned");
        }
        
        logger.debug('Summary generated successfully', { 
          model: retryCount === 0 ? 'geminiProModel' : 'geminiFlashModel',
          summaryLength: summary.length
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
    const promptPath = path.join(process.cwd(), 'agent_prompts', 'transcript_summary.md');
    
    try {
      return readFileSync(promptPath, 'utf-8');
    } catch (fileError) {
      // If the file doesn't exist or can't be read, return a default prompt
      logger.warn('Could not read transcript_summary.md, using default prompt', { error: fileError });
      
      return `
# Conversation Summary Generation

## Instructions

You are tasked with generating a concise summary of a conversation between an AI assistant and a user. The assistant was guided by a conversation plan with specific objectives.

1. Review the full transcript below
2. Review the conversation plan that guided the assistant
3. Generate a concise bullet-point summary that captures:
   - The main topics discussed
   - Key insights or feedback from the user
   - Important decisions or outcomes from the conversation
   - Any action items or next steps mentioned

## Conversation Plan
{conversation_plan}

## Transcript
{clean_transcript}

## Your Summary
Write a concise and informative bullet-point summary of this conversation below:
`;
    }
  } catch (error) {
    logger.error('Error getting prompt template:', error);
    throw error;
  }
}