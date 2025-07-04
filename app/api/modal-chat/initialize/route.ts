import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { chatResponsesTable } from '@/db/schema/chat-responses-schema';
import { chatInstancesTable } from '@/db/schema/chat-instances-schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import { warmAgentPrompt } from '@/lib/prompt-cache';
import { getProfileByUserId } from '@/db/queries/profiles-queries';
import crypto from 'crypto';

// Helper function to generate UUID
function generateUUID(): string {
  return crypto.randomUUID();
}

// Helper function to get modal chat instance by agent type
async function getModalChatInstanceByAgent(modalId: string, agentType: string) {
  const [chatInstance] = await db
    .select()
    .from(chatInstancesTable)
    .where(
      and(
        eq(chatInstancesTable.modalId, modalId),
        eq(chatInstancesTable.agentType, agentType),
        eq(chatInstancesTable.isModalAgent, true),
        eq(chatInstancesTable.isEnabled, true)
      )
    );
  
  return chatInstance || null;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    // For playground testing, we allow anonymous users temporarily
    // In production, this should require authentication
    
    const body = await request.json();
    const {
      modalId,
      agentType,
      intervieweeFirstName,
      intervieweeSecondName,
      intervieweeEmail,
      user_id: externalUserId,
      user_hash: externalUserHash,
      user_metadata: externalUserMetadata,
    } = body;

    if (!modalId || !agentType) {
      return NextResponse.json(
        { error: 'Modal ID and agent type are required' },
        { status: 400 }
      );
    }

    return await db.transaction(async (tx) => {
      // 1. Get chat instance for this modal + agent
      const chatInstance = await getModalChatInstanceByAgent(modalId, agentType);
      
      if (!chatInstance) {
        logger.error(`Chat instance not found for modal ${modalId} and agent ${agentType}`);
        return NextResponse.json(
          { error: 'Agent not found or not enabled for this modal' },
          { status: 404 }
        );
      }

      // 2. Create chat response immediately  
      const chatResponseId = generateUUID();
      
      // 3. Verify identity if provided
      let verifiedUserId: string | null = null;
      let verifiedUserMetadata: any = null;

      if (externalUserId) {
        try {
          // Fetch verification secret for workspace owner (profile)
          const profile = await getProfileByUserId(chatInstance.userId);
          const secret = profile?.verificationSecret;

          if (secret) {
            if (externalUserHash) {
              const expectedHash = crypto
                .createHmac('sha256', secret)
                .update(externalUserId)
                .digest('hex');
              if (expectedHash === externalUserHash) {
                verifiedUserId = externalUserId;
                verifiedUserMetadata = externalUserMetadata ?? null;
              } else {
                logger.warn('User hash verification failed', { externalUserId, chatInstanceId: chatInstance.id });
              }
            } else {
              logger.warn('Verification secret set but user_hash missing', { chatInstanceId: chatInstance.id });
            }
          } else {
            // No secret -> accept data without verification
            verifiedUserId = externalUserId;
            verifiedUserMetadata = externalUserMetadata ?? null;
          }
        } catch (err) {
          logger.error('Error verifying user hash', err);
        }
      }

      // Get profile for organization name (needed for variable substitution)
      const profile = await getProfileByUserId(chatInstance.userId);
      const organizationName = profile?.organisationName || '';

      // Extract name and email from userMetadata if available, with fallback to individual fields
      const userName = verifiedUserMetadata?.name || intervieweeFirstName;
      const userEmail = verifiedUserMetadata?.email || intervieweeEmail;

      await tx.insert(chatResponsesTable).values({
        id: chatResponseId,
        userId: chatInstance.userId, // Use the modal owner's user ID
        chatInstanceId: chatInstance.id,
        agentType: agentType, // Store for analytics
        status: "active",
        intervieweeFirstName: userName || null,
        intervieweeSecondName: intervieweeSecondName || null,
        intervieweeEmail: userEmail || null,
        intervieweeUserId: verifiedUserId,
        userMetadata: verifiedUserMetadata,
        interviewStartTime: new Date(),
        messagesJson: "[]",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 4. Pre-warm agent-specific prompt (background)
      // This runs asynchronously to not block the response
      setTimeout(() => {
        warmAgentPrompt(chatInstance.id, agentType).catch(error => {
          logger.error('Background prompt warming failed:', error);
        });
      }, 0);

      logger.info(`Chat initialized successfully: instance=${chatInstance.id}, response=${chatResponseId}, agent=${agentType}`);

      return NextResponse.json({
        chatInstanceId: chatInstance.id,
        chatResponseId,
        organizationName
      });
    });

  } catch (error) {
    logger.error('Error in modal chat initialization:', error);
    return NextResponse.json(
      { error: 'Failed to initialize chat', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 