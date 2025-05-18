import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { deleteChatInstance, getChatInstanceById, updateChatInstance, getChatInstanceWithBranding } from "@/db/queries/chat-instances-queries";
import { logger } from "@/lib/logger";
import { InsertChatInstance } from "@/db/schema/chat-instances-schema";
import { ConversationPlan } from "@/components/conversationPlanSchema";

/**
 * GET /api/chat-instances/[id]
 * 
 * Retrieves chat instance data needed for welcome screen and settings, including branding.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatInstanceId = params.id;
    if (!chatInstanceId) {
      return NextResponse.json({ error: "Missing chat instance ID" }, { status: 400 });
    }
    
    // Check if this is an external chat request
    const referer = request.headers.get('referer') || '';
    const isExternalRequest = referer.includes('/chat/external/');
    
    // Only check authentication for non-external requests
    let userId = null;
    if (!isExternalRequest) {
      const authResult = await auth();
      userId = authResult.userId;

      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Fetch chat instance data *including branding* using the updated query
    const chatInstanceWithBranding = await getChatInstanceWithBranding(chatInstanceId);

    if (!chatInstanceWithBranding) {
      logger.warn('Chat instance not found in GET request', { id: chatInstanceId });
      return NextResponse.json({ error: "Chat instance not found" }, { status: 404 });
    }

    // If it's not an external request, verify ownership
    if (!isExternalRequest && chatInstanceWithBranding.userId !== userId) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Structure the response including the branding object
    const responseData = {
      // Core instance data
      welcomeDescription: chatInstanceWithBranding.welcomeDescription,
      welcomeHeading: chatInstanceWithBranding.welcomeHeading,
      welcomeCardDescription: chatInstanceWithBranding.welcomeCardDescription,
      respondentContacts: chatInstanceWithBranding.respondentContacts,
      incentiveStatus: chatInstanceWithBranding.incentiveStatus,
      incentiveDescription: chatInstanceWithBranding.incentiveDescription,
      incentiveCode: chatInstanceWithBranding.incentiveCode,
      response_email_notifications: chatInstanceWithBranding.responseEmailNotifications,
      redirect_url: chatInstanceWithBranding.redirect_url,

      // Branding data nested in an object
      branding: {
        logoUrl: chatInstanceWithBranding.logoUrl,
        buttonColor: chatInstanceWithBranding.buttonColor,
        titleColor: chatInstanceWithBranding.titleColor,
      }
    };

    logger.debug('Returning chat instance data with branding', { id: chatInstanceId });
    return NextResponse.json(responseData);
  } catch (error) {
    logger.error("Failed to retrieve chat instance with branding:", { error: error instanceof Error ? error.message : String(error), id: params?.id });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    
    // Check if the chat instance exists and belongs to the user
    const chatInstance = await getChatInstanceById(id);
    
    if (!chatInstance) {
      return NextResponse.json({ error: "Chat instance not found" }, { status: 404 });
    }
    
    if (chatInstance.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Delete the chat instance
    await deleteChatInstance(id);
    
    logger.info('Chat instance deleted successfully', { id });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("Error deleting chat instance:", { error: error instanceof Error ? error.message : String(error), id: params?.id });
    return NextResponse.json({ error: "Failed to delete chat instance" }, { status: 500 });
  }
} 

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let rawBody: any;
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: "Missing chat instance ID" }, { status: 400 });
    }

    // Log the raw body first
    try {
        rawBody = await request.json();
        logger.debug('Received PATCH request body:', { id, body: rawBody });
    } catch (e) {
        logger.error('Failed to parse PATCH request body', { id, error: e });
        return new NextResponse("Invalid request body", { status: 400 });
    }
    const body = rawBody;

    // Check if the chat instance exists and belongs to the user
    const existingChat = await getChatInstanceById(id);
    
    if (!existingChat) {
      return NextResponse.json({ error: "Chat instance not found" }, { status: 404 });
    }
    
    if (existingChat.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Prepare updates object
    const updates: Partial<InsertChatInstance> = {};
    let updatePerformed = false;

    // Handle Title Update (within conversationPlan)
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim() === '') {
          return NextResponse.json({ error: "Title must be a non-empty string" }, { status: 400 });
      }
      const conversationPlan = existingChat.conversationPlan as ConversationPlan | undefined;
      if (conversationPlan) {
          updates.conversationPlan = { ...conversationPlan, title: body.title };
          updates.conversationPlanLastEdited = new Date();
          logger.info('Prepared title update within conversation plan', { id, title: body.title });
      } else {
          updates.topic = body.title;
          logger.info('Prepared title update using topic field (no plan found)', { id, title: body.title });
      }
       updatePerformed = true;
    }

    // Handle Other Fields (Incentives, Welcome, Published, Notifications, Redirect)
    if (body.respondentContacts !== undefined) updates.respondentContacts = body.respondentContacts;
    if (body.published !== undefined) updates.published = body.published;
    if (body.incentiveStatus !== undefined) updates.incentiveStatus = body.incentiveStatus;
    if (body.incentiveCode !== undefined) updates.incentiveCode = body.incentiveCode;
    if (body.incentiveDescription !== undefined) updates.incentiveDescription = body.incentiveDescription;
    if (body.welcomeHeading !== undefined) updates.welcomeHeading = body.welcomeHeading;
    if (body.welcomeCardDescription !== undefined) updates.welcomeCardDescription = body.welcomeCardDescription;
    if (body.welcomeDescription !== undefined) updates.welcomeDescription = body.welcomeDescription;
    if (body.responseEmailNotifications !== undefined) updates.responseEmailNotifications = body.responseEmailNotifications;
    if (body.redirect_url !== undefined) {
      updates.redirect_url = body.redirect_url;
    }
    if (body.interview_classification !== undefined) {
      updates.interview_type = body.interview_classification;
      logger.info('Mapped interview_classification to interview_type', { id, originalValue: body.interview_classification });
    } else if (body.interview_type !== undefined) {
      updates.interview_type = body.interview_type;
      logger.info('Received interview_type directly', { id, value: body.interview_type });
    }

    const updateKeys = Object.keys(updates);
    
    // Check if any update is being performed, including title update
    if (!updatePerformed && updateKeys.length === 0) {
        logger.warn('PATCH request body contained no valid fields for update', { id, body });
        return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 });
    }

    updates.updatedAt = new Date();

    logger.info('Attempting to update chat instance with final updates:', { id, updates });
    const updatedChat = await updateChatInstance(id, updates);

    if (!updatedChat) {
        logger.error('Failed to update chat instance in DB query', { id, updatesAttempted: updates });
        return NextResponse.json({ error: "Failed to update chat instance" }, { status: 500 });
    }

    logger.info('Chat instance updated via PATCH successfully', { id, updatedFields: updateKeys });
    return NextResponse.json(updatedChat);

  } catch (error) {
    let requestBodyForErrorLog = 'Could not read body for error log';
    try {
        requestBodyForErrorLog = rawBody ? JSON.stringify(rawBody) : 'Body already consumed or empty';
    } catch (parseError) { }

    logger.error('Error in chat instance PATCH handler:', {
        error: error instanceof Error ? error.message : String(error),
        id: params?.id || 'Unknown ID',
        requestBody: requestBodyForErrorLog,
        stack: error instanceof Error ? error.stack : undefined
     });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}