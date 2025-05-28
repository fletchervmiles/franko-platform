import { generateObject } from "ai";
import { z } from "zod";
import { readFileSync } from 'fs';
import path from 'path';
import { logger } from "@/lib/logger";
import { geminiFlashModel, gemini25ProPreviewModel } from "@/ai_folder";
import { type chatResponsesTable } from "@/db/schema/chat-responses-schema";

// Define the expected PMF category enum values for mapping
type PmfCategoryEnum = typeof chatResponsesTable.$inferInsert.pmf_category;

// Function to load the prompt template
function getPmfPromptTemplate(): string {
  try {
    return readFileSync(path.join(process.cwd(), 'agent_prompts', 'pmf_classifier.md'), 'utf-8');
  } catch (error) {
    logger.error('[pmf-classifier] Error reading PMF prompt template:', error);
    // Fallback to a basic prompt if the file is missing, though this shouldn't happen in a stable environment
    return `
# PMF Classification Prompt
## Role
You are a product-market-fit score extractor.
Return **only** a valid JSON object that conforms to the schema below.
Do **not** add explanations, commentary, or markdown.
## DATA INPUTS
Transcript:
{cleaned_transcript}
## TASK
Return the PMF response category.
## OUTPUT STRUCTURE
Return JSON only, exactly like:
{
  "pmf_category": "very disappointed" 
}
Possible values (case-sensitive, two words each):
"very disappointed"
"somewhat disappointed"
"not disappointed"
"unclassified"
`;
  }
}

/**
 * Classifies the PMF category from a transcript.
 * @param cleanTranscript The cleaned transcript of the conversation.
 * @returns A promise resolving to the PMF category enum value or null if unclassified/error.
 */
export async function classifyPmf(cleanTranscript: string): Promise<PmfCategoryEnum | null> {
  if (!cleanTranscript || typeof cleanTranscript !== 'string' || cleanTranscript.trim() === "") {
    logger.warn('[pmf-classifier] Clean transcript is empty or invalid. Skipping PMF classification.');
    return null;
  }

  const promptTemplate = getPmfPromptTemplate();
  const systemPrompt = promptTemplate.replace('{cleaned_transcript}', cleanTranscript);

  const pmfSchema = z.object({
    pmf_category: z.enum(["very disappointed", "somewhat disappointed", "not disappointed", "unclassified"]),
  });

  const maxRetries = 2;
  let retryCount = 0;
  let lastError: any = null;

  logger.debug('[pmf-classifier] Starting PMF classification attempt.', { transcriptLength: cleanTranscript.length });

  while (retryCount < maxRetries) {
    const modelToUse = retryCount === 0 ? geminiFlashModel : gemini25ProPreviewModel;
    const modelName = retryCount === 0 ? "geminiFlashModel" : "gemini25ProPreviewModel";
    try {
      logger.ai(`[pmf-classifier] Attempt ${retryCount + 1} with ${modelName}`);
      const result = await generateObject({
        model: modelToUse,
        system: systemPrompt,
        prompt: "", // Prompt is in system for this structure
        schema: pmfSchema,
        temperature: 0.2, // Lower temperature for more deterministic classification
      });

      const rawCategory = result.object.pmf_category;
      logger.debug(`[pmf-classifier] Raw PMF category from ${modelName}:`, { rawCategory });

      switch (rawCategory) {
        case "very disappointed":
          return "very";
        case "somewhat disappointed":
          return "somewhat";
        case "not disappointed":
          return "not";
        case "unclassified":
        default:
          return null;
      }
    } catch (error) {
      lastError = error;
      logger.warn(`[pmf-classifier] Attempt ${retryCount + 1} with ${modelName} failed:`, error);
      retryCount++;
      if (retryCount >= maxRetries) {
        logger.error('[pmf-classifier] All PMF classification attempts failed.', { lastError });
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, 500 * retryCount)); // Exponential backoff
    }
  }
  return null; // Should be unreachable if logic is correct
} 