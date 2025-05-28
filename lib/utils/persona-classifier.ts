import { generateObject } from "ai";
import { z } from "zod";
import { readFileSync } from 'fs';
import path from 'path';
import { logger } from "@/lib/logger";
import { geminiFlashModel, gemini25ProPreviewModel } from "@/ai_folder";
import { db } from "@/db/db";
import { userPersonasTable, type SelectUserPersona } from "@/db/schema/user-personas-schema";
import { eq } from "drizzle-orm";

// Helper function to normalize persona labels for matching
function normalizePersonaLabel(label: string | null | undefined): string {
  if (!label) return "";
  return label.toLowerCase().trim().replace(/[-_.]/g, ' ').replace(/\s+/g, ' ');
}

export interface PersonaCatalogueEntry {
  label: string; // Original label from the database
  normalizedLabel: string; // Normalized version for matching
  description: string | null;
}

// Function to load the prompt template
function getPersonaPromptTemplate(): string {
  try {
    return readFileSync(path.join(process.cwd(), 'agent_prompts', 'persona_classifier.md'), 'utf-8');
  } catch (error) {
    logger.error('[persona-classifier] Error reading Persona prompt template:', error);
    // Fallback prompt
    return `
# Persona Classification Prompt
## Role
You are a senior qualitative-insights classifier.
Return **only** a valid JSON object that conforms to the schema below.
## DATA INPUTS
Transcript:
{cleaned_transcript}
Persona Catalogue:
{persona_catalogue}
## TASK
Identify the single persona label that best matches the interviewee. The label MUST EXACTLY MATCH one from the Persona Catalogue.
## OUTPUT STRUCTURE
Return JSON only, exactly like:
{
  "persona": "Startup Founder"
}
If nothing fits:
{
  "persona": "UNCLASSIFIED"
}
`;
  }
}

/**
 * Fetches the persona catalogue for a given user, including normalized labels.
 * @param userId The ID of the user whose personas to fetch.
 * @returns A promise resolving to an array of persona catalogue entries.
 */
export async function getPersonaCatalogueForUser(userId: string): Promise<PersonaCatalogueEntry[]> {
  try {
    const personasFromDb = await db
      .select({
        label: userPersonasTable.personaName,
        description: userPersonasTable.personaDescription,
      })
      .from(userPersonasTable)
      .where(eq(userPersonasTable.profileUserId, userId));
    
    const catalogue = personasFromDb.map(p => ({
      label: p.label,
      normalizedLabel: normalizePersonaLabel(p.label),
      description: p.description || ""
    }));
    
    logger.debug('[persona-classifier] Fetched and normalized persona catalogue for user:', { userId, count: catalogue.length });
    return catalogue;
  } catch (error) {
    logger.error('[persona-classifier] Error fetching persona catalogue:', { userId, error });
    return []; 
  }
}


/**
 * Classifies the persona from a transcript based on a provided catalogue.
 * Uses normalized matching but returns the original catalogue label.
 * @param cleanTranscript The cleaned transcript.
 * @param personaCatalogue An array of available persona entries with original and normalized labels.
 * @returns A promise resolving to the classified original persona label (string) or "UNCLASSIFIED".
 */
export async function classifyPersona(
  cleanTranscript: string,
  personaCatalogue: PersonaCatalogueEntry[] // Expects entries with pre-normalized labels
): Promise<string> {
  const defaultPersona = "UNCLASSIFIED";

  if (!cleanTranscript || typeof cleanTranscript !== 'string' || cleanTranscript.trim() === "") {
    logger.warn('[persona-classifier] Clean transcript is empty or invalid. Skipping persona classification.');
    return defaultPersona;
  }

  if (!personaCatalogue || personaCatalogue.length === 0) {
    logger.warn('[persona-classifier] Persona catalogue is empty. Skipping persona classification.');
    return defaultPersona;
  }

  // For the prompt, we only need the original labels and descriptions.
  const catalogueForPrompt = personaCatalogue.map(p => ({ label: p.label, description: p.description }));

  const promptTemplate = getPersonaPromptTemplate();
  const systemPrompt = promptTemplate
    .replace('{cleaned_transcript}', cleanTranscript)
    .replace('{persona_catalogue}', JSON.stringify(catalogueForPrompt, null, 2));

  const personaSchema = z.object({
    persona: z.string().max(60), 
  });

  const maxRetries = 2;
  let retryCount = 0;
  let lastError: any = null;

  logger.debug('[persona-classifier] Starting persona classification attempt.', { 
    transcriptLength: cleanTranscript.length,
    catalogueSize: personaCatalogue.length 
  });

  while (retryCount < maxRetries) {
    const modelToUse = retryCount === 0 ? geminiFlashModel : gemini25ProPreviewModel;
    const modelName = retryCount === 0 ? "geminiFlashModel" : "gemini25ProPreviewModel";
    try {
      logger.ai(`[persona-classifier] Attempt ${retryCount + 1} with ${modelName}`);
      const result = await generateObject({
        model: modelToUse,
        system: systemPrompt,
        prompt: "",
        schema: personaSchema,
        temperature: 0.2,
      });

      const suggestedPersonaFromLLM = result.object.persona;
      const normalizedSuggestedPersona = normalizePersonaLabel(suggestedPersonaFromLLM);

      logger.debug(`[persona-classifier] Suggested persona from ${modelName}: '${suggestedPersonaFromLLM}'`, { normalized: normalizedSuggestedPersona });

      // Validate against the normalized labels in the provided catalogue
      const matchedEntry = personaCatalogue.find(p => p.normalizedLabel === normalizedSuggestedPersona);
      
      if (matchedEntry) {
        logger.info(`[persona-classifier] Matched '${suggestedPersonaFromLLM}' (normalized: '${normalizedSuggestedPersona}') to catalogue label '${matchedEntry.label}'`);
        return matchedEntry.label; // Return the ORIGINAL label from the catalogue
      }
      
      logger.warn(`[persona-classifier] Suggested persona '${suggestedPersonaFromLLM}' (normalized: '${normalizedSuggestedPersona}') not found in catalogue via normalized match. Returning ${defaultPersona}.`);
      return defaultPersona;

    } catch (error) {
      lastError = error;
      logger.warn(`[persona-classifier] Attempt ${retryCount + 1} with ${modelName} failed:`, error);
      retryCount++;
      if (retryCount >= maxRetries) {
        logger.error('[persona-classifier] All persona classification attempts failed.', { lastError });
        return defaultPersona;
      }
      await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
    }
  }
  return defaultPersona; 
} 