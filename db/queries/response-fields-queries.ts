import { db } from "@/db/db";
import {
  chatResponsesTable,
  responseFieldsTable,
  SelectResponseField,
} from "@/db/schema";
import { eq, and, desc, gte, sql, getTableColumns } from "drizzle-orm";

interface SnippetResult extends SelectResponseField {
  chatResponseCreatedAt: Date;
}

/**
 * Fetches the latest high-signal snippets for a specific field key, persona, and PMF category.
 *
 * @param fieldKey The field key to filter by (e.g., 'benefit').
 * @param signal The signal strength to filter by (e.g., 'high').
 * @param persona The persona to filter by.
 * @param pmfCategory The PMF category to filter by.
 * @param daysAgo The number of days back to look for responses.
 * @param limit The maximum number of snippets to return.
 * @returns A promise resolving to an array of snippet results including the response creation date.
 */
export async function getLatestSnippetsByCriteria(
  fieldKey: string,
  signal: string,
  persona: string,
  pmfCategory: string,
  daysAgo: number = 30,
  limit: number = 20
): Promise<SnippetResult[]> {
  try {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysAgo);

    const selectedColumns = {
      ...getTableColumns(responseFieldsTable),
      chatResponseCreatedAt: chatResponsesTable.createdAt,
    };

    const results = await db
      .select(selectedColumns)
      .from(responseFieldsTable)
      .innerJoin(
        chatResponsesTable,
        eq(responseFieldsTable.responseId, chatResponsesTable.id)
      )
      .where(
        and(
          eq(responseFieldsTable.fieldKey, fieldKey),
          eq(responseFieldsTable.signal, signal),
          eq(chatResponsesTable.persona, persona),
          eq(chatResponsesTable.pmf_category, pmfCategory),
          gte(chatResponsesTable.createdAt, dateThreshold)
        )
      )
      .orderBy(desc(chatResponsesTable.createdAt))
      .limit(limit);

    return results as SnippetResult[];

  } catch (error) {
    console.error("Error fetching latest snippets by criteria:", error);
    throw new Error("Failed to fetch snippets");
  }
} 