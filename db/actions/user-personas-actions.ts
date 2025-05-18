import { db } from "@/db/db";
import {
  userPersonasTable,
  chatResponsesTable,
  SelectUserPersona,
  InsertUserPersona,
} from "@/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import { getUserPersonas } from "../queries/user-personas-queries"; // Import query function

const MAX_USER_PERSONAS = 5;

/**
 * Creates a new persona definition for a user, respecting the limit.
 *
 * @param userId The user ID (profiles.userId) owning this persona.
 * @param name The name of the persona.
 * @param description Optional description for the persona.
 * @returns The newly created persona object.
 * @throws Error if the user already has the maximum number of personas.
 */
export async function createUserPersona(
  userId: string,
  name: string,
  description?: string
): Promise<SelectUserPersona> {
  try {
    // Check current persona count for the user
    const currentPersonas = await getUserPersonas(userId);
    if (currentPersonas.length >= MAX_USER_PERSONAS) {
      throw new Error(
        `User already has the maximum allowed number of personas (${MAX_USER_PERSONAS}).`
      );
    }

    const dataToInsert: InsertUserPersona = {
      profileUserId: userId,
      personaName: name,
      personaDescription: description || null,
    };

    const [newPersona] = await db
      .insert(userPersonasTable)
      .values(dataToInsert)
      .returning();

    if (!newPersona) {
        throw new Error("Failed to create persona, insert operation returned empty.")
    }

    return newPersona;

  } catch (error) {
    // Handle potential unique constraint violation (user + name)
    if (error instanceof Error && 'code' in error && error.code === '23505') { // Check for unique violation code (adjust code if needed for your DB)
        throw new Error(`Persona with name "${name}" already exists for this user.`);
    }
    console.error("Error creating user persona:", error);
    // Re-throw original error or a generic one
    throw error instanceof Error ? error : new Error("Failed to create user persona");
  }
}

/**
 * Updates a user's persona definition and cascades the name change to related chat responses.
 *
 * @param personaId The UUID of the persona definition to update.
 * @param newName The new name for the persona.
 * @param newDescription Optional new description for the persona.
 * @returns The updated persona object.
 * @throws Error if the persona is not found or update fails.
 */
export async function updateUserPersona(
  personaId: string,
  newName: string,
  newDescription?: string
): Promise<SelectUserPersona> {
  try {
    const updatedPersona = await db.transaction(async (tx) => {
      // 1. Fetch the current persona details (need profileUserId and old name)
      const [currentPersona] = await tx
        .select({
            profileUserId: userPersonasTable.profileUserId,
            oldName: userPersonasTable.personaName
        })
        .from(userPersonasTable)
        .where(eq(userPersonasTable.id, personaId));

      if (!currentPersona) {
        throw new Error(`Persona with ID ${personaId} not found.`);
      }

      const { profileUserId, oldName } = currentPersona;

      // Only proceed with cascading update if the name actually changed
      if (oldName !== newName) {
         console.log(`Updating chat_responses persona from "${oldName}" to "${newName}" for user ${profileUserId}`);
        // 2. Update chat_responses where userId and old persona name match
        const updateResult = await tx
          .update(chatResponsesTable)
          .set({ persona_category: newName })
          .where(
            and(
              eq(chatResponsesTable.userId, profileUserId),
              eq(chatResponsesTable.persona_category, oldName)
            )
          );
          console.log(`Updated chat responses associated with persona "${oldName}".`);
      }

      // 3. Update the user_personas table itself
      const [updatedRow] = await tx
        .update(userPersonasTable)
        .set({
          personaName: newName,
          personaDescription: newDescription === undefined ? sql`persona_description` : (newDescription || null), // Only update if provided
          updatedAt: new Date(), // Explicitly set update time
        })
        .where(eq(userPersonasTable.id, personaId))
        .returning();

       if (!updatedRow) {
         // This case should ideally not happen if the initial select worked, but good to check
         throw new Error("Failed to update persona after cascading changes.")
       }

      return updatedRow;
    });

    return updatedPersona;

  } catch (error) {
     // Handle potential unique constraint violation on update
    if (error instanceof Error && 'code' in error && error.code === '23505') { // Check for unique violation code
        throw new Error(`Persona with name "${newName}" already exists for this user.`);
    }
    console.error(`Error updating persona ${personaId}:`, error);
    throw error instanceof Error ? error : new Error("Failed to update user persona");
  }
}

/**
 * Deletes a user's persona definition and sets related chat responses to 'UNCLASSIFIED'.
 *
 * @param personaId The UUID of the persona definition to delete.
 * @throws Error if the persona is not found or deletion fails.
 */
export async function deleteUserPersona(personaId: string): Promise<void> {
  // --- [PERSONA DEBUG] Log deletion attempt --- 
  console.log(`[PERSONA DEBUG] deleteUserPersona called for personaId: ${personaId}. Stack trace snapshot:`);
  console.trace(); // Print stack trace to see who called this
  // --- End Persona Debug Logging ---
  try {
    await db.transaction(async (tx) => {
       // 1. Fetch the current persona details (need profileUserId and name for update)
       const [currentPersona] = await tx
        .select({
            profileUserId: userPersonasTable.profileUserId,
            name: userPersonasTable.personaName
        })
        .from(userPersonasTable)
        .where(eq(userPersonasTable.id, personaId));

      if (!currentPersona) {
        // Persona already deleted or never existed, consider this success
        console.warn(`Persona with ID ${personaId} not found for deletion.`);
        return;
      }

       const { profileUserId, name } = currentPersona;

      // 2. Update chat_responses: set persona to 'UNCLASSIFIED'
      console.log(`Setting chat_responses persona to UNCLASSIFIED from "${name}" for user ${profileUserId}`);
      const updateResult = await tx
        .update(chatResponsesTable)
        .set({ persona_category: 'UNCLASSIFIED' })
        .where(
          and(
            eq(chatResponsesTable.userId, profileUserId),
            eq(chatResponsesTable.persona_category, name)
          )
        );
       console.log(`Updated chat responses associated with persona "${name}" to UNCLASSIFIED.`);

      // 3. Delete the persona definition itself
      await tx.delete(userPersonasTable).where(eq(userPersonasTable.id, personaId));
      console.log(`Deleted persona definition ${personaId}`);
    });
  } catch (error) {
    console.error(`Error deleting persona ${personaId}:`, error);
     throw error instanceof Error ? error : new Error("Failed to delete user persona");
  }
}

/**
 * Merges chat responses from a source persona to a target persona for a specific user,
 * then deletes the source persona definition.
 *
 * @param userId The ID of the user owning the personas.
 * @param sourcePersonaId The UUID of the persona to merge from.
 * @param targetPersonaId The UUID of the persona to merge into.
 * @throws Error if source or target persona not found, or if merge fails.
 */
export async function mergeUserPersonas(
  userId: string,
  sourcePersonaId: string,
  targetPersonaId: string
): Promise<void> {
  if (sourcePersonaId === targetPersonaId) {
    throw new Error("Source and target persona cannot be the same.");
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Get names of source and target personas
      const [sourcePersona] = await tx
        .select({ name: userPersonasTable.personaName })
        .from(userPersonasTable)
        .where(and(
          eq(userPersonasTable.id, sourcePersonaId),
          eq(userPersonasTable.profileUserId, userId)
        ));

      const [targetPersona] = await tx
        .select({ name: userPersonasTable.personaName })
        .from(userPersonasTable)
        .where(and(
          eq(userPersonasTable.id, targetPersonaId),
          eq(userPersonasTable.profileUserId, userId)
        ));

      if (!sourcePersona) {
        throw new Error(`Source persona with ID ${sourcePersonaId} not found for user ${userId}.`);
      }
      if (!targetPersona) {
        throw new Error(`Target persona with ID ${targetPersonaId} not found for user ${userId}.`);
      }

      // 2. Update chat_responses: Change persona from source name to target name
      console.log(`Merging chat_responses persona from "${sourcePersona.name}" to "${targetPersona.name}" for user ${userId}`);
      await tx
        .update(chatResponsesTable)
        .set({ persona_category: targetPersona.name })
        .where(
          and(
            eq(chatResponsesTable.userId, userId),
            eq(chatResponsesTable.persona_category, sourcePersona.name)
          )
        );

      // 3. Delete the source persona definition
      // Note: deleteUserPersona already handles setting its responses to UNCLASSIFIED,
      // but we've already updated them to the target name, so direct delete is fine here.
      await tx
        .delete(userPersonasTable)
        .where(eq(userPersonasTable.id, sourcePersonaId));

      console.log(`Deleted source persona definition ${sourcePersonaId} after merge.`);
    });
  } catch (error) {
    console.error(`Error merging persona ${sourcePersonaId} into ${targetPersonaId}:`, error);
    throw error instanceof Error ? error : new Error("Failed to merge user personas");
  }
} 