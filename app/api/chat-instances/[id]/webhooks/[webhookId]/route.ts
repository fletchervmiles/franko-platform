import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server"; // Assuming Clerk for auth
import { getWebhookById, updateWebhook, deleteWebhook } from '@/db/queries/webhooks-queries';
import { logger } from '@/lib/logger';
import crypto from 'crypto'; // For regenerating secrets

// GET specific webhook (secret omitted)
export async function GET(
  request: Request,
  { params }: { params: { id: string, webhookId: string } }
) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      logger.warn('[API GET /webhooks/:id] Unauthorized: Missing X-User-Id header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: chatInstanceId, webhookId } = params;
    if (!chatInstanceId || !webhookId) {
      return NextResponse.json({ error: 'Chat Instance ID and Webhook ID are required' }, { status: 400 });
    }

    // getWebhookById performs auth check internally by checking ownership of the parent chat instance
    const webhook = await getWebhookById(userId, webhookId);

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found or access denied' }, { status: 404 });
    }

    // Ensure the webhook actually belongs to the specified chat instance path
    if (webhook.chatInstanceId !== chatInstanceId) {
       logger.warn('Webhook found but does not belong to the specified chat instance path', { webhookId, chatIdParam: chatInstanceId, actualChatId: webhook.chatInstanceId });
       return NextResponse.json({ error: 'Webhook not found' }, { status: 404 }); // Treat as not found
    }


    // Secret is already omitted by the query function
    return NextResponse.json(webhook);

  } catch (error: any) {
    logger.error('Error fetching webhook:', { error: error.message, stack: error.stack, webhookId: params.webhookId });
    // getWebhookById doesn't throw permission errors, it returns null, handled above.
    return NextResponse.json({ error: 'Failed to fetch webhook' }, { status: 500 });
  }
}

// PUT (Update) specific webhook
export async function PUT(
  request: Request,
  { params }: { params: { id: string, webhookId: string } }
) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      logger.warn('[API PUT /webhooks/:id] Unauthorized: Missing X-User-Id header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: chatInstanceId, webhookId } = params;
     if (!chatInstanceId || !webhookId) {
      return NextResponse.json({ error: 'Chat Instance ID and Webhook ID are required' }, { status: 400 });
    }

    const body = await request.json();
    const { url, description, isActive, regenerateSecret } = body;

    const updateData: Partial<{ url: string, description: string | null, isActive: boolean, secret: string | null }> = {};
    let secretIncludedInResponse = false;

    // --- Input Validation & Data Preparation ---
    if (url !== undefined) {
        if (typeof url !== 'string' || !url) {
             return NextResponse.json({ error: 'Webhook URL must be a non-empty string' }, { status: 400 });
        }
         try {
            new URL(url);
            if (!url.startsWith('https://')) {
                 logger.warn('Webhook URL does not start with https://', { url });
            }
         } catch (_) {
            return NextResponse.json({ error: 'Invalid Webhook URL format' }, { status: 400 });
         }
        updateData.url = url;
    }
    if (description !== undefined) {
        if (description !== null && typeof description !== 'string') {
             return NextResponse.json({ error: 'Description must be a string or null' }, { status: 400 });
        }
        updateData.description = description;
    }
     if (isActive !== undefined) {
        if (typeof isActive !== 'boolean') {
             return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
        }
        updateData.isActive = isActive;
    }
    if (regenerateSecret !== undefined) {
        if (typeof regenerateSecret !== 'boolean') {
            return NextResponse.json({ error: 'regenerateSecret must be a boolean' }, { status: 400 });
        }
        if (regenerateSecret) {
            // Generate and add the new secret to the update payload
            updateData.secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
            secretIncludedInResponse = true; // Flag that the response should include the secret
        } else {
            // Allow explicitly setting secret to null if needed in future?
            // For now, regenerate=false doesn't change the secret.
            // If you want to allow *removing* a secret:
            // updateData.secret = null;
        }
    }
     // --- End Validation ---

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }


    // updateWebhook performs auth check internally
    // It returns secret only if 'secret' was in updateData (i.e., regenerateSecret was true)
    const updatedWebhook = await updateWebhook(userId, webhookId, updateData);

    // Ensure the webhook (still) belongs to the specified chat instance path after update (though unlikely to change)
     if (updatedWebhook.chatInstanceId !== chatInstanceId) {
       logger.error('Webhook updated but somehow belongs to a different chat instance now - potential issue!', { webhookId, chatIdParam: chatInstanceId, actualChatId: updatedWebhook.chatInstanceId });
       // Don't return potentially sensitive data from wrong context
       return NextResponse.json({ error: 'Update conflict' }, { status: 409 });
    }


    // The query function handles omitting/including the secret based on the updateData used
    return NextResponse.json(updatedWebhook);

  } catch (error: any) {
    logger.error('Error updating webhook:', { error: error.message, stack: error.stack, webhookId: params.webhookId });
    if (error.message.includes('permission') || error.message.includes('Webhook not found')) {
        return NextResponse.json({ error: 'Webhook not found or access denied' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 });
  }
}

// DELETE specific webhook
export async function DELETE(
  request: Request,
  { params }: { params: { id: string, webhookId: string } }
) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      logger.warn('[API DELETE /webhooks/:id] Unauthorized: Missing X-User-Id header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

     const { id: chatInstanceId, webhookId } = params;
     if (!chatInstanceId || !webhookId) {
      return NextResponse.json({ error: 'Chat Instance ID and Webhook ID are required' }, { status: 400 });
    }

    // deleteWebhook performs auth check internally
    // Note: deleteWebhook is designed to be idempotent (doesn't fail if already deleted)
    // We need to check ownership *before* calling delete if we want to return 404 vs 403 specifically
    // Let's rely on the check within deleteWebhook for now.

    await deleteWebhook(userId, webhookId);

    // No content response for successful deletion
    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    logger.error('Error deleting webhook:', { error: error.message, stack: error.stack, webhookId: params.webhookId });
     if (error.message.includes('permission')) {
        // This error is thrown by deleteWebhook if ownership check fails
        return NextResponse.json({ error: 'Webhook not found or access denied' }, { status: 404 }); // Treat permission denied as not found
    }
    // Other errors (e.g., database connection)
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
  }
}