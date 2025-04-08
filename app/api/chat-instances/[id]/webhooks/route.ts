import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server"; // Assuming Clerk for auth
import { createWebhook, listWebhooksByChatInstanceId } from '@/db/queries/webhooks-queries';
import { logger } from '@/lib/logger';
import crypto from 'crypto'; // For generating secrets

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    logger.debug('[API GET /webhooks] Received request', { params }); // Log received params
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      logger.warn('[API GET /webhooks] Unauthorized: Missing X-User-Id header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatInstanceId = params.id;
    if (!chatInstanceId) {
      return NextResponse.json({ error: 'Chat Instance ID is required' }, { status: 400 });
    }

    const webhooksList = await listWebhooksByChatInstanceId(userId, chatInstanceId);
    return NextResponse.json(webhooksList);

  } catch (error: any) {
    logger.error('Error listing webhooks:', { error: error.message, stack: error.stack, chatId: params.id });
    // Distinguish between permission errors and others
    if (error.message.includes('permission')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to list webhooks' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      logger.warn('[API POST /webhooks] Unauthorized: Missing X-User-Id header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatInstanceId = params.id;
    if (!chatInstanceId) {
      return NextResponse.json({ error: 'Chat Instance ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { url, description, addSecret } = body;

    // --- Input Validation ---
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Webhook URL is required and must be a string' }, { status: 400 });
    }
    // Basic URL validation (consider a more robust library like 'zod' for production)
    try {
      new URL(url);
      if (!url.startsWith('https://')) {
           logger.warn('Webhook URL does not start with https://', { url });
           // Decide if you want to enforce HTTPS strictly
           // return NextResponse.json({ error: 'Webhook URL must use HTTPS' }, { status: 400 });
      }
    } catch (_) {
      return NextResponse.json({ error: 'Invalid Webhook URL format' }, { status: 400 });
    }
    if (description && typeof description !== 'string') {
        return NextResponse.json({ error: 'Description must be a string' }, { status: 400 });
    }
    if (addSecret && typeof addSecret !== 'boolean') {
        return NextResponse.json({ error: 'addSecret must be a boolean' }, { status: 400 });
    }
    // --- End Validation ---


    let secret: string | null = null;
    if (addSecret) {
        // Generate a secure secret
        secret = `whsec_${crypto.randomBytes(24).toString('hex')}`; // Prefix helps identify the key type
    }

    const newWebhookData = {
      url,
      description: description || null, // Handle optional description
      secret: secret, // Store the generated secret or null
    };

    // The createWebhook function handles auth check internally
    const createdWebhook = await createWebhook(userId, chatInstanceId, newWebhookData);

    // Return the FULL webhook object, including the secret, ONLY on creation
    return NextResponse.json(createdWebhook, { status: 201 });

  } catch (error: any) {
    logger.error('Error creating webhook:', { error: error.message, stack: error.stack, chatId: params.id });
     if (error.message.includes('permission')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Handle potential duplicate errors or other DB constraints if needed
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
}