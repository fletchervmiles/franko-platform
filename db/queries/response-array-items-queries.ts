import { db } from "@/db/db";
import {
  chatResponsesTable,
  responseArrayItemsTable,
} from "@/db/schema";
import { eq, and, desc, gte, count, sql } from "drizzle-orm";

interface TopMentionResult {
  value: string | null;
  mentions: number;
}

/**
 * Fetches the top mentioned values for a specific array key within a given timeframe.
 *
 * @param arrayKey The array key to filter by (e.g., 'featureSignals').
 * @param sinceDate The date from which to include responses.
 * @param limit The maximum number of top mentioned values to return.
 * @returns A promise resolving to an array of objects containing the value and mention count.
 */
export async function getTopMentionedArrayItems(
  arrayKey: string,
  sinceDate: Date,
  limit: number = 10
): Promise<TopMentionResult[]> {
  try {
    const results = await db
      .select({
        value: responseArrayItemsTable.value,
        mentions: count(responseArrayItemsTable.value), // Use count aggregation
      })
      .from(responseArrayItemsTable)
      .innerJoin(
        chatResponsesTable,
        eq(responseArrayItemsTable.responseId, chatResponsesTable.id)
      )
      .where(
        and(
          eq(responseArrayItemsTable.arrayKey, arrayKey),
          gte(chatResponsesTable.createdAt, sinceDate) // Filter by response creation date
        )
      )
      .groupBy(responseArrayItemsTable.value) // Group by the item value
      .orderBy(desc(count(responseArrayItemsTable.value))) // Order by mention count descending
      .limit(limit);

    return results;

  } catch (error) {
    console.error("Error fetching top mentioned array items:", error);
    throw new Error("Failed to fetch top mentioned items");
  }
} 