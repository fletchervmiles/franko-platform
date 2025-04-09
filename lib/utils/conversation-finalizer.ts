/**
 * Conversation Finalizer Utility
 * 
 * Orchestrates the finalization of a conversation:
 * 1. Updates end time and calculates duration
 * 2. Cleans the transcript
 * 3. Calculates completion status
 * 4. Counts user words
 * 5. Updates usage tracking if completion rate > 50%
 * 6. Generates a summary if completion rate > 0%
 * 7. Sends email notification if enabled
 */

import { db } from "@/db/db";
import { getChatResponseById, updateChatResponse } from "@/db/queries/chat-responses-queries";
import { type SelectChatResponse } from "@/db/schema/chat-responses-schema";
import { getChatInstanceById } from "@/db/queries/chat-instances-queries";
import { getProfileByUserId } from "@/db/queries/profiles-queries";
import { cleanTranscript } from "./transcript-cleaner";
import { calculateCompletionStatus } from "./completion-calculator";
import { countUserWords } from "./word-counter";
import { updateUsageCount } from "./usage-tracker";
import { generateSummary } from "./summary-generator";
import { logger } from "@/lib/logger";
import { sendResponseNotification } from "@/lib/email-service";
import { getLatestObjectives } from "./conversation-helper";
import crypto from 'crypto';
import { getActiveWebhooksForEvent } from '@/db/queries/webhooks-queries';
import { Webhook } from '@/db/schema/webhooks';

/**
 * Finalizes a conversation by updating various metrics, generating a summary, and sending notification
 * 
 * @param chatResponseId - The ID of the chat response to finalize
 * @returns Promise that resolves when finalization is complete
 */
export async function finalizeConversation(chatResponseId: string): Promise<void> {
  logger.debug('[finalizeConversation] Starting...', { chatResponseId });
  try {
    logger.info('Finalizing conversation:', { chatResponseId });
    
    // Add a delay to ensure the latest messages have been saved to the database
    // This helps prevent race conditions with asynchronous message saving
    logger.debug('Waiting for latest messages to be saved before finalizing');
    await new Promise(resolve => setTimeout(resolve, 9000)); // 9-second delay
    
    // Fetch the chat response
    const chatResponse = await getChatResponseById(chatResponseId);
    if (!chatResponse) {
      throw new Error(`Chat response not found: ${chatResponseId}`);
    }
    
    // Fetch the associated chat instance
    const chatInstance = await getChatInstanceById(chatResponse.chatInstanceId);
    if (!chatInstance) {
      throw new Error(`Chat instance not found: ${chatResponse.chatInstanceId}`);
    }
    
    // Set the end time and calculate the duration
    // If the cron job is finalizing, interviewEndTime in DB will be null
    const isCronFinalization = !chatResponse.interviewEndTime;
    const interviewEndTime = chatResponse.interviewEndTime || new Date(); // Use existing if available, else set to now
    const startTime = chatResponse.interviewStartTime || chatResponse.createdAt;
    
    // Only calculate duration if it wasn't a cron finalization
    const totalInterviewMinutes = isCronFinalization 
      ? null 
      : Math.round((interviewEndTime.getTime() - startTime.getTime()) / (1000 * 60));
    
    // Clean the transcript
    let transcript = '';
    if (chatResponse.messagesJson) {
      transcript = cleanTranscript(
        chatResponse.messagesJson,
        chatResponse.intervieweeFirstName ?? undefined
      );
    }
    
    // Calculate completion status using objectives from the latest message
    let completionStatus = '0%';
    if (chatResponse.messagesJson) {
      try {
        const objectives = getLatestObjectives(chatResponse.messagesJson);
        if (objectives) {
          completionStatus = calculateCompletionStatus(objectives);
          logger.debug('Calculated completion status:', { completionStatus, objectiveCount: Object.keys(objectives).length });
        } else {
          logger.warn('No objectives found for completion calculation');
        }
      } catch (error) {
        logger.error('Error calculating completion status:', error);
      }
    }
    
    // Convert completion status to a number for comparison
    const completionRate = parseInt(completionStatus.replace('%', ''), 10);
    
    // Count user words
    const userWords = chatResponse.messagesJson ? 
      countUserWords(chatResponse.messagesJson).toString() : 
      '0';
    
    // Generate summary if completion rate > 0%
    let summary = '';
    let finalChatResponseData: SelectChatResponse | undefined = undefined;
    if (!isNaN(completionRate) && completionRate > 0 && transcript) {
      try {
        summary = await generateSummary(
          transcript,
          chatInstance.conversationPlan as Record<string, unknown> ?? {},
          completionRate
        );
      } catch (summaryError) {
        logger.error('Error generating summary:', summaryError);
        // Continue without a summary if generation fails
      }
    }
    
    // Update the chat response with all the new values
    await db.transaction(async (tx) => {
      await updateChatResponse(
        chatResponseId,
        {
          interviewEndTime,
          totalInterviewMinutes,
          cleanTranscript: transcript,
          completionStatus,
          user_words: userWords,
          transcript_summary: summary,
          status: 'completed'
        },
      );
    });
    
    // Fetch the complete, updated chat response *after* the transaction
    try {
      finalChatResponseData = await getChatResponseById(chatResponseId);
      if (!finalChatResponseData) {
        throw new Error('Failed to fetch updated chat response after transaction.');
      }
    } catch (fetchError: any) {
      logger.error('Failed to fetch final chat response data after update:', { chatResponseId, error: fetchError.message });
      // Decide if we should proceed without triggering webhooks or re-throw
      // For now, let's prevent webhook trigger if fetching failed
      finalChatResponseData = undefined; 
    }
    
    // Trigger Webhooks (Non-blocking)
    logger.debug('[finalizeConversation] Preparing to trigger webhooks...');
    if (finalChatResponseData) {
      triggerConversationCompletedWebhooks(finalChatResponseData);
    } else {
      logger.warn('Could not trigger webhooks due to missing final chat response data after update', { chatResponseId });
    }
    
    // Update usage count if completion rate > 50% (non-blocking)
    if (!isNaN(completionRate) && completionRate > 50) {
      try {
        await updateUsageCount(chatResponse.userId, completionRate);
      } catch (usageError) {
        logger.error('Error updating usage count:', usageError);
        // Continue even if usage update fails
      }
    }
    
    // Send email notification if enabled (non-blocking)
    if (chatInstance.responseEmailNotifications && !isNaN(completionRate) && completionRate > 0) {
      try {
        // Extract conversation title from conversation plan if available
        let conversationTitle = undefined;
        if (chatInstance.conversationPlan) {
          try {
            const planData = JSON.parse(chatInstance.conversationPlan as string);
            conversationTitle = planData.title || planData.name;
          } catch (parseError) {
            logger.warn('Could not parse conversation plan for title:', parseError);
          }
        }
        
        // Get user profile to get email and name
        const userProfile = await getProfileByUserId(chatResponse.userId);
        if (userProfile && userProfile.email && userProfile.firstName) {
          logger.info('Sending response notification email', { 
            email: userProfile.email,
            name: userProfile.firstName,
            conversationTitle
          });
          
          await sendResponseNotification(
            userProfile.email,
            userProfile.firstName,
            conversationTitle,
            chatInstance.id as string
          );
          
          logger.info('Response notification email sent successfully');
        } else {
          logger.warn('Could not send response notification: User profile incomplete', {
            userId: chatResponse.userId
          });
        }
      } catch (emailError) {
        logger.error('Error sending response notification email:', emailError);
        // Continue even if email sending fails
      }
    } else if (chatInstance.responseEmailNotifications && (isNaN(completionRate) || completionRate <= 0)) {
      // Optionally log if email was skipped due to 0% completion
      logger.info('Skipping email notification for 0% completion chat', { chatResponseId });
    }
    
    logger.info('Conversation finalized successfully', { 
      chatResponseId, 
      completionStatus, 
      totalInterviewMinutes, 
      userWords 
    });
  } catch (error) {
    logger.error('Error finalizing conversation:', error);
    throw error;
  }
}

/**
 * Fetches and triggers all active 'conversation.completed' webhooks for a given chat response.
 * This function is designed to be non-blocking ('fire and forget').
 * @param finalChatResponse - The finalized chat response object.
 */
async function triggerConversationCompletedWebhooks(finalChatResponse: SelectChatResponse): Promise<void> {
  const { chatInstanceId, id: chatResponseId } = finalChatResponse;
  logger.debug('Checking for webhooks to trigger', { chatInstanceId, chatResponseId });

  try {
    const activeWebhooks = await getActiveWebhooksForEvent(chatInstanceId, 'conversation.completed');

    if (activeWebhooks.length === 0) {
      logger.debug('No active webhooks found for conversation.completed event', { chatInstanceId });
      return;
    }

    logger.info(`Found ${activeWebhooks.length} webhooks to trigger for conversation completion`, { chatInstanceId, chatResponseId });

    // Define the payload - select relevant fields from finalChatResponse
    // Ensure sensitive data (like full transcript if large) is considered carefully
    const payload = {
      event: 'conversation.completed',
      chatResponseId: finalChatResponse.id,
      chatInstanceId: finalChatResponse.chatInstanceId,
      userId: finalChatResponse.userId,
      status: finalChatResponse.status,
      interviewStartTime: finalChatResponse.interviewStartTime,
      interviewEndTime: finalChatResponse.interviewEndTime,
      totalInterviewMinutes: finalChatResponse.totalInterviewMinutes,
      completionStatus: finalChatResponse.completionStatus,
      userWords: finalChatResponse.user_words,
      transcriptSummary: finalChatResponse.transcript_summary,
      cleanTranscript: finalChatResponse.cleanTranscript,
      intervieweeFirstName: finalChatResponse.intervieweeFirstName,
      intervieweeSecondName: finalChatResponse.intervieweeSecondName,
      intervieweeEmail: finalChatResponse.intervieweeEmail, // Be mindful of privacy regulations
      createdAt: finalChatResponse.createdAt,
      updatedAt: finalChatResponse.updatedAt,
    };

    const payloadString = JSON.stringify(payload);

    // Log the exact payload being sent for debugging
    logger.debug('Sending webhook payload', { chatResponseId, payload: payloadString });

    // Trigger each webhook asynchronously
    activeWebhooks.forEach(webhook => {
      triggerSingleWebhook(webhook, payloadString)
        .catch(error => {
          // Catch errors from the async trigger function itself (e.g., during setup)
          logger.error('Error setting up webhook trigger:', { webhookId: webhook.id, url: webhook.url, error: error.message });
        });
    });

  } catch (error: any) {
    logger.error('Error fetching or preparing webhooks:', { chatInstanceId, error: error.message, stack: error.stack });
    // Don't block finalization if webhook fetching fails
  }
}

/**
 * Sends a single webhook POST request asynchronously.
 * Handles signature generation and logs results.
 * @param webhook - The webhook configuration object (including secret).
 * @param payloadString - The JSON stringified payload.
 */
async function triggerSingleWebhook(webhook: Webhook, payloadString: string): Promise<void> {
  const { id: webhookId, url, secret } = webhook;
  logger.debug('Attempting to trigger webhook', { webhookId, url });

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'User-Agent': 'FrankoPlatform-Webhook/1.0' // Optional: Identify your webhook source
    };

    // Generate signature if secret exists
    if (secret) {
      try {
        const signature = crypto
          .createHmac('sha256', secret)
          .update(payloadString)
          .digest('hex');
        headers['X-Webhook-Signature'] = signature;
        logger.debug('Webhook signature generated', { webhookId });
      } catch (sigError: any) {
        logger.error('Failed to generate webhook signature', { webhookId, url, error: sigError.message });
        // Decide if you want to proceed without signature or stop
        return; // Stop if signature generation fails
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: payloadString,
      // Add a timeout? Depends on requirements. Default fetch timeout is often long.
      // signal: AbortSignal.timeout(10000) // Example: 10 second timeout
    });

    if (response.ok) {
      logger.info('Webhook triggered successfully', { webhookId, url, status: response.status });
    } else {
      // Log error but don't throw, as this is non-blocking
      logger.warn('Webhook trigger failed with non-OK status', {
        webhookId,
        url,
        status: response.status,
        statusText: response.statusText
      });
      // Optionally try reading the response body for more details
      // const responseBody = await response.text();
      // logger.debug('Webhook failure response body:', { responseBody });
    }
  } catch (error: any) {
    // Catch fetch errors (network issues, DNS errors, etc.)
    logger.error('Error triggering webhook fetch request:', {
      webhookId,
      url,
      error: error.message,
      errorCode: error.code // e.g., ENOTFOUND, ECONNREFUSED
    });
  }
}