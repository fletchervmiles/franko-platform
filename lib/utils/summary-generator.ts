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
import { 
  geminiFlashModel, 
  gemini25ProPreviewModel // Import the new model
} from "@/ai_folder";

/**
 * Generates a summary of a conversation using the AI SDK
 * 
 * @param cleanTranscript - The cleaned transcript of the conversation
 * @param conversationPlan - The conversation plan as a string or object
 * @param completionRate - The completion rate as a number or string
 * @param extractionJson - Optional extraction JSON as a record or null
 * @returns Promise resolving to the generated summary
 */
export async function generateSummary(
  cleanTranscript: string,
  conversationPlan: string | Record<string, unknown>,
  completionRate: number | string,
  extractionJson?: Record<string, unknown> | null
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
    
    // Convert extraction JSON to string
    const extractionString = extractionJson ? JSON.stringify(extractionJson, null, 2) : 'None';
    
    // Read the prompt template
    const promptTemplate = getPromptTemplate();
    
    // Replace placeholders with actual values
    const systemPrompt = promptTemplate
      .replace('{clean_transcript}', cleanTranscript)
      .replace('{conversation_plan}', planString)
      .replace('{extraction_json}', extractionString);
    
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
    const promptPath = path.join(process.cwd(), 'agent_prompts', 'transcript_summary.md');
    
    try {
      return readFileSync(promptPath, 'utf-8');
    } catch (fileError) {
      // If the file doesn't exist or can't be read, return a default prompt
      logger.warn('Could not read transcript_summary.md, using default prompt', { error: fileError });
      
      return `
# Conversation Transcript Summary

## Task
You will create a concise, informative summary of a conversation transcript between an AI agent and a respondent. The summary should capture key insights and findings from the conversation.

## Instructions
1. Analyze the entire conversation transcript provided
2. Consider the conversation plan that guided the agent
3. Identify the main topics, key points, and notable insights
4. Create a clear, well-structured summary using bullet points
5. Focus on what was actually discussed, not the planned objectives
6. Highlight concrete feedback, opinions, and user experiences
7. Keep the summary concise (maximum 10 bullet points)
8. Do not include introductions, greetings, or conclusion remarks
9. Use markdown formatting for better readability
10. Organize points logically, not necessarily in the order they appeared

## Format 
Use the following structure for your summary:
- Use level 3 headings (###) for main topic areas
- Use bullet points for specific details under each topic
- Bold (**text**) important terms or concepts
- Use italic (_text_) for emphasis when appropriate
- Keep each bullet point focused on a single idea or finding

## Conversation Plan
{conversation_plan}

## High-Signal Extraction JSON
{extraction_json}

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