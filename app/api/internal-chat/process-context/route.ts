import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { 
  getInternalChatSessionById, 
  updateInternalChatSession 
} from "@/db/queries/internal-chat-sessions-queries";
import { getChatInstanceById } from "@/db/queries/chat-instances-queries";
import { getChatResponseById } from "@/db/queries/chat-responses-queries";
import { logger } from '@/lib/logger';
import { db } from "@/db/db";
import { chatResponsesTable } from "@/db/schema/chat-responses-schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { sessionId, chatInstanceIds } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get the session
    const session = await getInternalChatSessionById(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Verify user owns the session
    if (session.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to access this session" },
        { status: 403 }
      );
    }

    // Determine which chat instances to process
    let selectedChatInstances = [];
    
    // If chatInstanceIds are provided, use those
    if (chatInstanceIds && Array.isArray(chatInstanceIds) && chatInstanceIds.length > 0) {
      selectedChatInstances = chatInstanceIds;
    } 
    // Otherwise, use the chat instances already associated with the session
    else if (session.selectedResponses) {
      try {
        selectedChatInstances = JSON.parse(session.selectedResponses as string);
      } catch (parseError) {
        logger.error("Error parsing selectedResponses", { 
          parseError, 
          rawValue: session.selectedResponses 
        });
        // Continue with empty array
      }
    }

    if (selectedChatInstances.length === 0) {
      return NextResponse.json(
        { error: "No chat instances to process" },
        { status: 400 }
      );
    }

    // Process the chat instances and build context
    const { contextData, processedInstances, failedInstances, totalResponses } = 
      await processChatInstanceContext(selectedChatInstances, session.contextData as string);

    // Update the session with the new context data
    await updateInternalChatSession(sessionId, {
      contextData
    });

    return NextResponse.json({ 
      success: true,
      processedInstancesCount: processedInstances.length,
      failedInstancesCount: failedInstances.length,
      failedInstances,
      totalResponses
    });
  } catch (error) {
    console.error("Error processing context:", error);
    return NextResponse.json(
      { error: "Failed to process context" },
      { status: 500 }
    );
  }
}

/**
 * Process chat instance data and build context for the AI
 */
async function processChatInstanceContext(chatInstanceIds: string[], existingContext?: string) {
  let contextData = "";
  let totalChatInstances = 0;
  let totalResponses = 0;
  let totalWords = 0;
  let conversationPlans = "";
  const processedInstances: string[] = [];
  const failedInstances: string[] = [];
  
  // Process each chat instance
  for (const chatInstanceId of chatInstanceIds) {
    try {
      logger.debug(`Fetching chat instance ${chatInstanceId}`);
      const chatInstance = await getChatInstanceById(chatInstanceId);
      
      if (!chatInstance) {
        logger.error(`Chat instance ${chatInstanceId} not found`);
        failedInstances.push(chatInstanceId);
        continue;
      }
      
      totalChatInstances++;
      processedInstances.push(chatInstanceId);
      
      // Process conversation plan
      let planTitle = "Conversation";
      try {
        if (chatInstance.conversationPlan) {
          // Convert the entire conversation plan to a readable string
          const planObj = typeof chatInstance.conversationPlan === 'string'
            ? JSON.parse(chatInstance.conversationPlan)
            : chatInstance.conversationPlan;
            
          logger.debug(`Conversation plan structure for chat instance ${chatInstanceId}:`, { 
            planStructure: Object.keys(planObj || {})
          });
            
          if (planObj && planObj.title) {
            planTitle = planObj.title;
            
            // Format the conversation plan for context - use the entire plan as a JSON string
            conversationPlans += `\n--- CONVERSATION PLAN: ${planObj.title} ---\n`;
            // Convert the entire plan object to a formatted string
            conversationPlans += JSON.stringify(planObj, null, 2);
            conversationPlans += `\n--- END PLAN ---\n\n`;
          }
        }
      } catch (planError) {
        logger.error(`Error processing conversation plan for chat instance ${chatInstanceId}`, { planError });
        // Continue with default title
      }
      
      // Fetch all responses for this chat instance
      const responses = await db
        .select()
        .from(chatResponsesTable)
        .where(eq(chatResponsesTable.chatInstanceId, chatInstanceId));
      
      logger.debug(`Found ${responses.length} responses for chat instance ${chatInstanceId}`);
      
      if (responses.length === 0) {
        contextData += `--- CHAT INSTANCE: ${planTitle} ---\n`;
        contextData += `No responses found for this chat instance.\n`;
        contextData += `--- END CHAT INSTANCE ---\n\n`;
        continue;
      }
      
      // Process each response for this chat instance
      let instanceResponses = 0;
      let instanceWords = 0;
      
      contextData += `--- CHAT INSTANCE: ${planTitle} ---\n`;
      
      for (const response of responses) {
        instanceResponses++;
        totalResponses++;
        
        // Try to parse messages
        let messages = [];
        try {
          if (response.messagesJson) {
            messages = JSON.parse(response.messagesJson);
          }
        } catch (msgError) {
          logger.error(`Error parsing messages for response ${response.id}`, { msgError });
          // Continue with empty messages
        }
        
        // Add response data even if some parts fail
        const responseUserWords = Number(response.user_words || "0");
        instanceWords += responseUserWords;
        totalWords += responseUserWords;
        
        // Format the conversation data
        contextData += `\n--- RESPONSE #${instanceResponses} ---\n`;
        contextData += `Respondent: ${response.intervieweeFirstName ? `${response.intervieweeFirstName} ${response.intervieweeSecondName || ''}` : "Anonymous"}\n`;
        contextData += `Email: ${response.intervieweeEmail || "Not provided"}\n`;
        contextData += `User Words: ${responseUserWords}\n`;
        
        if (response.transcript_summary) {
          contextData += `Summary: ${response.transcript_summary}\n`;
        }
        
        contextData += "Transcript:\n";
        
        // Use cleanTranscript if available, otherwise fallback to messagesJson processing
        if (response.cleanTranscript) {
          logger.debug(`Using cleanTranscript for response ${response.id}`);
          contextData += response.cleanTranscript;
        } else {
          logger.debug(`No cleanTranscript found for response ${response.id}, using messagesJson`);
          // Fallback to processing messagesJson
          for (const msg of messages) {
            if (msg.role === 'user') {
              contextData += `USER: ${msg.content || ''}\n`;
            } else if (msg.role === 'assistant') {
              contextData += `ASSISTANT: ${typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}\n`;
            }
          }
        }
        
        contextData += `--- END RESPONSE #${instanceResponses} ---\n`;
      }
      
      contextData += `\nTotal responses for this chat instance: ${instanceResponses}\n`;
      contextData += `Total user words: ${instanceWords}\n`;
      contextData += `--- END CHAT INSTANCE ---\n\n`;
      
    } catch (instanceError) {
      logger.error(`Error processing chat instance ${chatInstanceId}`, { instanceError });
      failedInstances.push(chatInstanceId);
      // Continue with next chat instance
    }
  }
  
  // If no chat instances were processed, return the existing context
  if (totalChatInstances === 0) {
    return { 
      contextData: existingContext || "", 
      processedInstances, 
      failedInstances,
      totalResponses: 0
    };
  }
  
  // Create system prompt for analysis
  const systemPrompt = `
You are an AI assistant helping with analysis of research conversation data. You have access to ${totalChatInstances} conversation types with a total of ${totalResponses} responses containing ${totalWords} user words.

Your task is to analyze this data and provide insights based on user questions. Consider patterns, themes, and notable responses. Be concise but thorough in your analysis.

${conversationPlans ? `These conversations were conducted with the context of the following plan(s):\n\n${conversationPlans}` : ''}

The context below contains the full conversation data from these responses:

${contextData}

When analyzing the data:
1. Consider both explicit statements and implicit themes
2. Look for patterns across multiple respondents
3. Highlight interesting contrasts or outliers
4. Provide specific examples when relevant
5. Summarize key findings clearly

Remember that you are analyzing existing data, not conducting new interviews.
`;

  // If there's existing context, append the new context
  let finalContext = systemPrompt;
  if (existingContext && existingContext.trim() !== "") {
    // This is a simplified approach - in a real implementation, you might want to
    // merge the contexts more intelligently to avoid duplication
    finalContext = existingContext + "\n\n" + systemPrompt;
  }

  return { 
    contextData: finalContext, 
    processedInstances, 
    failedInstances,
    totalResponses
  };
} 