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
import { getChatInstanceById } from "@/db/queries/chat-instances-queries";
import { getProfileByUserId } from "@/db/queries/profiles-queries";
import { cleanTranscript } from "./transcript-cleaner";
import { calculateCompletionStatus } from "./completion-calculator";
import { countUserWords } from "./word-counter";
import { updateUsageCount } from "./usage-tracker";
import { generateSummary } from "./summary-generator";
import { logger } from "@/lib/logger";
import { sendResponseNotification } from "@/app/api/send/route";
import { getLatestObjectives } from "./conversation-helper";

/**
 * Finalizes a conversation by updating various metrics, generating a summary, and sending notification
 * 
 * @param chatResponseId - The ID of the chat response to finalize
 * @returns Promise that resolves when finalization is complete
 */
export async function finalizeConversation(chatResponseId: string): Promise<void> {
  try {
    logger.info('Finalizing conversation:', { chatResponseId });
    
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
    const interviewEndTime = new Date();
    const startTime = chatResponse.interviewStartTime || chatResponse.createdAt;
    const totalInterviewMinutes = Math.round(
      (interviewEndTime.getTime() - startTime.getTime()) / (1000 * 60)
    );
    
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
    if (chatInstance.responseEmailNotifications) {
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