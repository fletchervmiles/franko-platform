import { db } from "@/db/db";
import { modalsTable, type InsertModal, type SelectModal } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";

/**
 * Create a new modal widget
 */
export async function createModal(data: InsertModal): Promise<SelectModal> {
  const [modal] = await db.insert(modalsTable).values(data).returning();
  if (!modal) {
    throw new Error("Failed to create modal");
  }
  return modal;
}

/**
 * Get a modal by ID (with user ownership check)
 */
export async function getModalById(id: string, userId: string): Promise<SelectModal | undefined> {
  const [modal] = await db
    .select()
    .from(modalsTable)
    .where(and(eq(modalsTable.id, id), eq(modalsTable.userId, userId)));
  return modal;
}

/**
 * Get a modal by embed slug (public access)
 */
export async function getModalBySlug(embedSlug: string): Promise<SelectModal | undefined> {
  const [modal] = await db
    .select()
    .from(modalsTable)
    .where(and(eq(modalsTable.embedSlug, embedSlug), eq(modalsTable.isActive, true)));
  return modal;
}

/**
 * Get all modals for a user
 */
export async function getModalsByUserId(userId: string): Promise<SelectModal[]> {
  return await db
    .select()
    .from(modalsTable)
    .where(eq(modalsTable.userId, userId))
    .orderBy(modalsTable.updatedAt);
}

/**
 * Update a modal (with user ownership check)
 */
export async function updateModal(
  id: string,
  userId: string,
  updates: Partial<InsertModal>
): Promise<SelectModal | undefined> {
  const [modal] = await db
    .update(modalsTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(modalsTable.id, id), eq(modalsTable.userId, userId)))
    .returning();
  return modal;
}

/**
 * Delete a modal (with user ownership check)
 */
export async function deleteModal(id: string, userId: string): Promise<void> {
  await db
    .delete(modalsTable)
    .where(and(eq(modalsTable.id, id), eq(modalsTable.userId, userId)));
}

/**
 * Check if an embed slug is available
 */
export async function isEmbedSlugAvailable(embedSlug: string, excludeModalId?: string): Promise<boolean> {
  const baseCondition = eq(modalsTable.embedSlug, embedSlug);
  
  const conditions = excludeModalId 
    ? and(baseCondition, ne(modalsTable.id, excludeModalId))
    : baseCondition;

  const [existing] = await db
    .select({ id: modalsTable.id })
    .from(modalsTable)
    .where(conditions);
  
  return !existing;
}

/**
 * Update modal brand settings
 */
export async function updateModalBrandSettings(
  id: string,
  userId: string,
  brandSettings: any
): Promise<SelectModal | undefined> {
  return updateModal(id, userId, { brandSettings });
} 