import { db } from "@/db/db";
import {
  chatResponsesTable,
  responseFieldsTable,
  responseArrayItemsTable,
} from "@/db/schema";
import { eq } from "drizzle-orm";

// Define the structure expected from the LLM extraction
interface LlmNugget {
  text?: string;
  snippet?: string;
  signal?: 'high' | 'medium' | 'low' | string; // Allow other strings for flexibility
}

// Interface for the parsed LLM output based on the plan
interface ParsedLlmOutput {
  persona?: string;
  pmfCategory?: 'VD' | 'SD' | 'ND' | string; // VD/SD/ND etc.
  // Add other potential fields based on the plan's examples (benefit, gap, valueVoice, etc.)
  benefit?: LlmNugget;
  gap?: LlmNugget;
  valueVoice?: LlmNugget;
  // Add more potential nugget fields here as needed...
  // Array fields
  featureSignals?: string[];
  characteristics?: string[];
  // The raw JSON itself will also be stored
  [key: string]: any; // Allow other keys dynamically
}

/**
 * Processes the parsed LLM extraction output and updates the database atomically.
 * - Updates chat_responses with persona, pmfCategory, and raw JSON.
 * - Inserts individual nuggets into response_fields.
 * - Inserts array items into response_array_items.
 *
 * @param responseId The UUID of the chat response to update.
 * @param parsedOutput The parsed JSON object from the LLM extraction.
 */
export async function processLlmExtraction(
  responseId: string,
  parsedOutput: ParsedLlmOutput
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      console.log(`Starting ETL transaction for response ID: ${responseId}`);

      // 1. Update chat_responses table
      console.log("Updating chat_responses table...");
      await tx
        .update(chatResponsesTable)
        .set({
          persona: parsedOutput.persona || 'UNCLASSIFIED', // Use default if undefined
          pmf_category: parsedOutput.pmfCategory || null, // Use null if undefined
          extraction_json: parsedOutput, // Store the raw parsed JSON
        })
        .where(eq(chatResponsesTable.id, responseId));
      console.log("chat_responses updated.");

      // 2. Prepare and insert into response_fields
      console.log("Preparing data for response_fields...");
      const fieldsToInsert: (typeof responseFieldsTable.$inferInsert)[] = [];
      const knownArrayKeys = ['featureSignals', 'characteristics']; // Keys to exclude from single fields

      for (const [key, value] of Object.entries(parsedOutput)) {
        // Check if it's a nugget object (has text/snippet/signal) and not a known array key or top-level metadata
        if (
          typeof value === 'object' &&
          value !== null &&
          !knownArrayKeys.includes(key) &&
          key !== 'persona' &&
          key !== 'pmfCategory' &&
          (value.text || value.snippet || value.signal)
        ) {
          const nugget = value as LlmNugget; // Type assertion
          fieldsToInsert.push({
            responseId: responseId,
            fieldKey: key,
            distilledText: nugget.text || null,
            snippet: nugget.snippet || null,
            signal: nugget.signal || null,
          });
        }
      }

      if (fieldsToInsert.length > 0) {
        console.log(`Inserting ${fieldsToInsert.length} rows into response_fields...`);
        await tx.insert(responseFieldsTable).values(fieldsToInsert);
        console.log("response_fields inserted.");
      } else {
        console.log("No data to insert into response_fields.");
      }

      // 3. Prepare and insert into response_array_items
      console.log("Preparing data for response_array_items...");
      const arrayItemsToInsert: (typeof responseArrayItemsTable.$inferInsert)[] = [];
      const arrayKeys = ['featureSignals', 'characteristics'] as const; // Define potential array keys

      for (const key of arrayKeys) {
        if (Array.isArray(parsedOutput[key])) {
          parsedOutput[key].forEach((itemValue: any) => {
            // Ensure itemValue is a string or can be reasonably converted
            const valueAsString = typeof itemValue === 'string' ? itemValue : JSON.stringify(itemValue);
            arrayItemsToInsert.push({
              responseId: responseId,
              arrayKey: key,
              value: valueAsString,
            });
          });
        }
      }

      if (arrayItemsToInsert.length > 0) {
         console.log(`Inserting ${arrayItemsToInsert.length} rows into response_array_items...`);
        await tx.insert(responseArrayItemsTable).values(arrayItemsToInsert);
        console.log("response_array_items inserted.");
      } else {
         console.log("No data to insert into response_array_items.");
      }

      console.log(`ETL transaction completed successfully for response ID: ${responseId}`);
    });
  } catch (error) {
    console.error(`Error processing LLM extraction for response ID ${responseId}:`, error);
    // Re-throw the error so the caller knows the transaction failed
    throw new Error(`Failed to process LLM extraction for response ID ${responseId}.`);
  }
} 