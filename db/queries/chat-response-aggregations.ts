import { db } from "@/db/db";
import { chatResponsesTable } from "@/db/schema";
import { count, sql, eq } from "drizzle-orm";

interface PmfCountsByPersona {
  persona: string | null;
  vd_count: number;
  sd_count: number;
  nd_count: number; // Added ND count for completeness, can be adjusted
  total_count: number;
}

/**
 * Gets counts of PMF categories (VD, SD, ND) grouped by persona.
 *
 * @returns A promise resolving to an array of objects containing persona and counts.
 */
export async function getPmfCountsByPersona(): Promise<PmfCountsByPersona[]> {
  try {
    // Using sql template for conditional counting (FILTER equivalent)
    const results = await db
      .select({
        persona: chatResponsesTable.persona,
        vd_count: sql<number>`count(*) filter (where ${chatResponsesTable.pmf_category} = 'VD')`.mapWith(Number),
        sd_count: sql<number>`count(*) filter (where ${chatResponsesTable.pmf_category} = 'SD')`.mapWith(Number),
        nd_count: sql<number>`count(*) filter (where ${chatResponsesTable.pmf_category} = 'ND')`.mapWith(Number),
        total_count: count(chatResponsesTable.id), // Total count for the persona
      })
      .from(chatResponsesTable)
      .groupBy(chatResponsesTable.persona)
      .orderBy(chatResponsesTable.persona); // Optional: order by persona

    return results;

  } catch (error) {
    console.error("Error fetching PMF counts by persona:", error);
    throw new Error("Failed to fetch PMF counts by persona");
  }
} 