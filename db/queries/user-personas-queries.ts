import { db } from "@/db/db";
import { userPersonasTable, SelectUserPersona } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Fetches all defined personas for a given user.
 *
 * @param userId The user ID (from profiles.userId) to fetch personas for.
 * @returns A promise resolving to an array of user personas, ordered by creation date.
 */
export async function getUserPersonas(userId: string): Promise<SelectUserPersona[]> {
  try {
    const personas = await db
      .select()
      .from(userPersonasTable)
      .where(eq(userPersonasTable.profileUserId, userId))
      .orderBy(desc(userPersonasTable.createdAt)); // Order by newest first, adjust if needed

    return personas;
  } catch (error) {
    console.error(`Error fetching personas for user ${userId}:`, error);
    throw new Error("Failed to fetch user personas");
  }
}

// Placeholder for getPersonaById if needed later
export async function getPersonaById(id: string): Promise<SelectUserPersona | undefined> {
  try {
    const [persona] = await db
      .select()
      .from(userPersonasTable)
      .where(eq(userPersonasTable.id, id))
      .limit(1);
    return persona;
  } catch (error) {
    console.error(`Error fetching persona by ID ${id}:`, error);
    throw new Error("Failed to fetch persona by ID");
  }
} 