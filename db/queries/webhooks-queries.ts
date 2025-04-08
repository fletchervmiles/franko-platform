import { db } from '@/db/db';
import { webhooks, NewWebhook, Webhook } from '@/db/schema/webhooks';
import { eq, and } from 'drizzle-orm';
import { getChatInstanceById } from './chat-instances-queries'; // Assuming this exists
import { logger } from '@/lib/logger'; // Assuming logger exists

// Helper to verify ownership
async function verifyChatInstanceOwnership(userId: string, chatInstanceId: string): Promise<boolean> {
  const chatInstance = await getChatInstanceById(chatInstanceId);
  return !!chatInstance && chatInstance.userId === userId;
}

/**
 * Creates a new webhook associated with a chat instance.
 * @param userId - The ID of the user creating the webhook (for auth check).
 * @param chatInstanceId - The ID of the chat instance.
 * @param webhookData - The data for the new webhook (url, description, secret - if provided).
 * @returns The newly created webhook object (including the secret).
 * @throws Error if chat instance not found or user does not own it.
 */
export async function createWebhook(
  userId: string,
  chatInstanceId: string,
  webhookData: Pick<NewWebhook, 'url' | 'description' | 'secret'>
): Promise<Webhook> {
  const isOwner = await verifyChatInstanceOwnership(userId, chatInstanceId);
  if (!isOwner) {
    throw new Error('User does not have permission to add webhooks to this chat instance.');
  }

  const newWebhookData: NewWebhook = {
    ...webhookData,
    chatInstanceId: chatInstanceId,
    // Defaults for eventType, isActive, timestamps are handled by the DB schema
  };

  logger.debug('Creating new webhook', { chatInstanceId, url: webhookData.url });
  const [createdWebhook] = await db.insert(webhooks).values(newWebhookData).returning();

  if (!createdWebhook) {
      throw new Error('Failed to create webhook in database.');
  }
  logger.info('Webhook created successfully', { webhookId: createdWebhook.id, chatInstanceId });
  return createdWebhook; // Return the full object including secret
}

/**
 * Lists all webhooks for a given chat instance, excluding secrets.
 * @param userId - The ID of the user requesting the list (for auth check).
 * @param chatInstanceId - The ID of the chat instance.
 * @returns An array of webhook objects (without secrets).
 * @throws Error if chat instance not found or user does not own it.
 */
export async function listWebhooksByChatInstanceId(
  userId: string,
  chatInstanceId: string
): Promise<Omit<Webhook, 'secret'>[]> {
  const isOwner = await verifyChatInstanceOwnership(userId, chatInstanceId);
  if (!isOwner) {
    throw new Error('User does not have permission to view webhooks for this chat instance.');
  }

  logger.debug('Listing webhooks for chat instance', { chatInstanceId });
  const results = await db
    .select({
      // Explicitly select all fields EXCEPT secret
      id: webhooks.id,
      chatInstanceId: webhooks.chatInstanceId,
      url: webhooks.url,
      description: webhooks.description,
      eventType: webhooks.eventType,
      isActive: webhooks.isActive,
      createdAt: webhooks.createdAt,
      updatedAt: webhooks.updatedAt,
    })
    .from(webhooks)
    .where(eq(webhooks.chatInstanceId, chatInstanceId))
    .orderBy(webhooks.createdAt); // Optional: order by creation date

  return results;
}

/**
 * Gets a specific webhook by its ID, excluding the secret.
 * @param userId - The ID of the user requesting the webhook (for auth check).
 * @param webhookId - The ID of the webhook.
 * @returns The webhook object (without the secret) or null if not found or access denied.
 */
export async function getWebhookById(
  userId: string,
  webhookId: string
): Promise<Omit<Webhook, 'secret'> | null> {
   logger.debug('Fetching webhook by ID', { webhookId });
   const result = await db
    .select({
      // Explicitly select all fields EXCEPT secret
      id: webhooks.id,
      chatInstanceId: webhooks.chatInstanceId,
      url: webhooks.url,
      description: webhooks.description,
      eventType: webhooks.eventType,
      isActive: webhooks.isActive,
      createdAt: webhooks.createdAt,
      updatedAt: webhooks.updatedAt,
    })
    .from(webhooks)
    .where(eq(webhooks.id, webhookId))
    .limit(1);

  if (result.length === 0) {
    logger.warn('Webhook not found', { webhookId });
    return null;
  }

  // Verify ownership via the chat instance
  const webhook = result[0];
  const isOwner = await verifyChatInstanceOwnership(userId, webhook.chatInstanceId);
  if (!isOwner) {
     logger.warn('User does not own the chat instance associated with this webhook', { userId, webhookId, chatInstanceId: webhook.chatInstanceId });
    return null; // Treat as not found for security
  }

  return webhook;
}

/**
 * Updates an existing webhook.
 * @param userId - The ID of the user updating the webhook (for auth check).
 * @param webhookId - The ID of the webhook to update.
 * @param updateData - The data to update (url, description, isActive, secret).
 * @returns The updated webhook object (including secret ONLY if it was just regenerated).
 * @throws Error if webhook not found or user does not own it.
 */
export async function updateWebhook(
  userId: string,
  webhookId: string,
  updateData: Partial<Pick<Webhook, 'url' | 'description' | 'isActive' | 'secret'>>
): Promise<Webhook | Omit<Webhook, 'secret'>> { // Return type depends on whether secret was updated
  logger.debug('Attempting to update webhook', { webhookId, updateData: { ...updateData, secret: updateData.secret ? '[PRESENT]' : '[NOT_PRESENT]' } });

  // First, fetch the existing webhook to check ownership via chatInstanceId
  const existingWebhook = await db.select({ chatInstanceId: webhooks.chatInstanceId })
      .from(webhooks)
      .where(eq(webhooks.id, webhookId))
      .limit(1);

  if (existingWebhook.length === 0) {
      throw new Error('Webhook not found.');
  }

  const isOwner = await verifyChatInstanceOwnership(userId, existingWebhook[0].chatInstanceId);
  if (!isOwner) {
      throw new Error('User does not have permission to update this webhook.');
  }

  // Perform the update
  const [updatedWebhook] = await db
    .update(webhooks)
    .set({
      ...updateData,
      updatedAt: new Date(), // Manually set update time as $onUpdate might not trigger depending on ORM/DB version
    })
    .where(eq(webhooks.id, webhookId))
    .returning(); // Return the full updated object

  if (!updatedWebhook) {
    throw new Error('Failed to update webhook in database.');
  }

  logger.info('Webhook updated successfully', { webhookId });

  // Only return the secret if it was part of THIS update request
  // This is crucial for the "regenerate secret" flow.
  if ('secret' in updateData) {
      return updatedWebhook; // Return full object including the new secret
  } else {
      // Otherwise, omit the secret
      const { secret, ...rest } = updatedWebhook;
      return rest;
  }
}

/**
 * Deletes a webhook.
 * @param userId - The ID of the user deleting the webhook (for auth check).
 * @param webhookId - The ID of the webhook to delete.
 * @returns True if deletion was successful.
 * @throws Error if webhook not found or user does not own it.
 */
export async function deleteWebhook(userId: string, webhookId: string): Promise<boolean> {
  logger.debug('Attempting to delete webhook', { webhookId });

   // First, fetch the existing webhook to check ownership via chatInstanceId
   const existingWebhook = await db.select({ chatInstanceId: webhooks.chatInstanceId })
    .from(webhooks)
    .where(eq(webhooks.id, webhookId))
    .limit(1);

  if (existingWebhook.length === 0) {
      // Allow deletion attempt even if not found, make it idempotent
      logger.warn('Webhook not found during delete attempt, proceeding idempotently.', { webhookId });
      return true;
  }

  const isOwner = await verifyChatInstanceOwnership(userId, existingWebhook[0].chatInstanceId);
  if (!isOwner) {
      throw new Error('User does not have permission to delete this webhook.');
  }

  // Perform the deletion
  const result = await db.delete(webhooks).where(eq(webhooks.id, webhookId));

  // Assume success if no error was thrown after ownership check
  // const success = result.rowCount > 0; // Assuming rowCount property exists
  // if (success) { 
  //   logger.info('Webhook deleted successfully', { webhookId });
  // } else {
       // This case might happen in a race condition if deleted between check and delete op
  //    logger.warn('Webhook deletion command executed but no rows affected.', { webhookId });
  // }
  logger.info('Webhook deleted successfully (or was already deleted)', { webhookId });

  return true; // Return true even if no rows affected, as the state is "deleted"
}

/**
 * Fetches all active webhooks for a specific event type and chat instance ID.
 * This is used by the finalizer and NEEDS the secret.
 * @param chatInstanceId - The ID of the chat instance.
 * @param eventType - The type of event (e.g., 'conversation.completed').
 * @returns An array of full webhook objects including secrets.
 */
export async function getActiveWebhooksForEvent(
    chatInstanceId: string,
    eventType: string = 'conversation.completed'
): Promise<Webhook[]> {
    logger.debug('Fetching active webhooks for event', { chatInstanceId, eventType });
    const results = await db
        .select() // Select all columns
        .from(webhooks)
        .where(
            and(
                eq(webhooks.chatInstanceId, chatInstanceId),
                eq(webhooks.eventType, eventType),
                eq(webhooks.isActive, true)
            )
        );
    logger.debug(`Found ${results.length} active webhooks for event`, { chatInstanceId, eventType });
    return results; // Return full objects including secrets
} 