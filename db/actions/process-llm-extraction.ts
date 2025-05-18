import { db } from "@/db/db";
import { logger } from "@/lib/logger";
import {
  chatResponsesTable,
  responseFieldsTable,
  responseArrayItemsTable,
  type InsertChatResponse, // Import the type for chatResponsesTable
} from "@/db/schema";
import { eq } from "drizzle-orm";

// Define the structure expected from the LLM extraction
interface LlmNugget {
  text?: string;
  snippet?: string;
  signal?: 'high' | 'medium' | 'low' | string; // Allow other strings for flexibility
}

interface PersonaInfoNugget {
  title?: string | null;
  jobFunction?: string | null;
  companyType?: string | null;
  context?: string | null;
  snippet?: string | null;
}

// Interface for the parsed LLM output based on the plan
export interface ParsedLlmOutput { // Exporting for use in conversation-finalizer
  // Fields that might be in the extraction but are handled by dedicated classifiers beforehand
  // persona?: string; // This will come from finalPersonaCategory
  // pmfCategory?: string; // This will come from finalPmfCategory
  
  benefit?: LlmNugget;
  gap?: LlmNugget;
  valueVoice?: LlmNugget;
  acquisition?: LlmNugget;
  decisionTrigger?: LlmNugget;
  activation?: LlmNugget;
  jtbd?: LlmNugget;
  preToolPain?: LlmNugget;
  firstValue?: LlmNugget;
  suggestions?: LlmNugget;
  alternativeTool?: LlmNugget;
  idealUserVoice?: LlmNugget;
  jobFunction?: LlmNugget; // New standard nugget
  companyType?: LlmNugget; // New standard nugget
  churnReason?: LlmNugget;
  churnMoment?: LlmNugget;
  retentionHook?: LlmNugget;
  adoptionBarrier?: LlmNugget;
  priceObjection?: LlmNugget;
  retentionDriver?: LlmNugget;
  sentiment?: { value?: string; snippet?: string }; // value is now optional to handle potential LLM misses
  featureSignals?: string[];
  characteristics?: string[];
  overallSummary?: string; 
  [key: string]: any; 
}

// Helper to map sentiment string to enum type or null
function mapSentiment(value?: string | null): InsertChatResponse['sentiment'] {
  if (!value) return null;
  const lowerValue = value.toLowerCase();
  if (lowerValue === 'positive' || lowerValue === 'neutral' || lowerValue === 'negative') {
    return lowerValue as InsertChatResponse['sentiment'];
  }
  return null;
}

/**
 * Processes the parsed LLM extraction output and updates the database atomically.
 */
export async function processLlmExtraction(
  responseId: string,
  parsedOutput: ParsedLlmOutput | null,
  finalPmfCategory: InsertChatResponse['pmf_category'],
  finalPersonaCategory: string,
  finalInterviewType: string | null
): Promise<void> {
  if (!parsedOutput) {
    logger.warn(`[processLlmExtraction] Parsed output is null for response ID: ${responseId}. Skipping ETL portion, but updating pre-classified fields.`);
    try {
      await db.update(chatResponsesTable).set({
        persona_category: finalPersonaCategory,
        pmf_category: finalPmfCategory,
        interview_type: finalInterviewType,
      }).where(eq(chatResponsesTable.id, responseId));
      logger.info(`[processLlmExtraction] Updated chat_responses with pre-classified data (including interview_type) for response ID: ${responseId} despite null extraction.`);
    } catch (error) {
      logger.error(`[processLlmExtraction] Error updating chat_responses with pre-classified data for response ID ${responseId} when extraction was null:`, error);
    }
    return;
  }
  const currentParsedOutput = parsedOutput;

  try {
    await db.transaction(async (tx) => {
      logger.info(`[processLlmExtraction] Starting ETL transaction for response ID: ${responseId}`);

      // 1. Update chat_responses table
      logger.info("[processLlmExtraction] Updating chat_responses table...");
      await tx
        .update(chatResponsesTable)
        .set({
          persona_category: finalPersonaCategory,
          pmf_category: finalPmfCategory,
          extraction_json: currentParsedOutput, 
          characteristics_json: Array.isArray(currentParsedOutput.characteristics) ? currentParsedOutput.characteristics : null,
          sentiment: mapSentiment(currentParsedOutput.sentiment?.value),
          interview_type: finalInterviewType
        })
        .where(eq(chatResponsesTable.id, responseId));
      logger.info("[processLlmExtraction] chat_responses updated.");

      // 2. Prepare and insert into response_fields
      logger.info("[processLlmExtraction] Preparing data for response_fields...");
      await tx.delete(responseFieldsTable).where(eq(responseFieldsTable.responseId, responseId));
      const fieldsToInsert: (typeof responseFieldsTable.$inferInsert)[] = [];
      const knownArrayKeys = ['featureSignals', 'characteristics']; 
      const topLevelMetaKeys = ['persona', 'pmfCategory', 'overallSummary', 'sentiment', ...knownArrayKeys];

      for (const [key, value] of Object.entries(currentParsedOutput)) {
        if (typeof value === 'object' && value !== null && !topLevelMetaKeys.includes(key)) {
          const nugget = value as LlmNugget;
          const distilledText = nugget.text || null;
          const snippet = nugget.snippet || null;
          const signalLevel = (['high','medium','low'].includes(String(nugget.signal).toLowerCase())) ? (String(nugget.signal).toLowerCase() as any) : null;

          // Only insert if there is at least some data for the nugget
          if (distilledText !== null || snippet !== null || signalLevel !== null) {
            fieldsToInsert.push({
              responseId: responseId,
              fieldKey: key,
              distilledText: distilledText,
              snippet: snippet,
              signal_level: signalLevel,
            });
          }
        }
      }
      
      // Handle sentiment field specifically
      const sentimentValue = currentParsedOutput.sentiment?.value || null;
      const sentimentSnippet = currentParsedOutput.sentiment?.snippet || null;

      if (sentimentValue !== null || sentimentSnippet !== null) {
        fieldsToInsert.push({
          responseId,
          fieldKey: 'sentiment',
          distilledText: sentimentValue,
          snippet: sentimentSnippet,
          signal_level: null, 
        });
      }

      if (fieldsToInsert.length > 0) {
        logger.info(`[processLlmExtraction] Inserting ${fieldsToInsert.length} rows into response_fields...`);
        await tx.insert(responseFieldsTable).values(fieldsToInsert);
        logger.info("[processLlmExtraction] response_fields inserted.");
      } else {
        logger.info("[processLlmExtraction] No data to insert into response_fields.");
      }

      // 3. Prepare and insert into response_array_items
      logger.info("[processLlmExtraction] Preparing data for response_array_items...");
      await tx.delete(responseArrayItemsTable).where(eq(responseArrayItemsTable.responseId, responseId));
      const arrayItemsToInsert: (typeof responseArrayItemsTable.$inferInsert)[] = [];
      const arrayKeysToProcess = ['featureSignals', 'characteristics'] as const;

      for (const key of arrayKeysToProcess) {
        const arrayValue = currentParsedOutput[key];
        if (Array.isArray(arrayValue)) {
          arrayValue.forEach((itemValue: any) => {
            const valueAsString = typeof itemValue === 'string' ? itemValue : JSON.stringify(itemValue);
            if (valueAsString) { // Ensure we don't insert null/empty values if the array somehow contains them
              arrayItemsToInsert.push({
                responseId: responseId,
                arrayKey: key,
                value: valueAsString,
              });
            }
          });
        }
      }

      if (arrayItemsToInsert.length > 0) {
         logger.info(`[processLlmExtraction] Inserting ${arrayItemsToInsert.length} rows into response_array_items...`);
        await tx.insert(responseArrayItemsTable).values(arrayItemsToInsert);
        logger.info("[processLlmExtraction] response_array_items inserted.");
      } else {
         logger.info("[processLlmExtraction] No data to insert into response_array_items.");
      }

      logger.info(`[processLlmExtraction] ETL transaction completed successfully for response ID: ${responseId}`);
    });
  } catch (error) {
    logger.error(`[processLlmExtraction] Error processing LLM extraction for response ID ${responseId}:`, error);
    throw new Error(`Failed to process LLM extraction for response ID ${responseId}.`);
  }
} 