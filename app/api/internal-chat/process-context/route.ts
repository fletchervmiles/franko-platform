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
You are an AI assistant helping analyze research conversation data interactively. (note, this prompt may appear twice if multiple conversation instances are added - this is expected behavior.)

## Data Overview:

You currently have access to ${totalChatInstances} conversation type(s), containing a total of ${totalResponses} individual responses with approximately ${totalWords} words contributed by users.

${conversationPlans ? `These conversations were conducted according to the following conversation plan(s):

${conversationPlans}` : 'No specific conversation plans were provided for this data set.'}


**Full Conversation Data (for reference):**
${contextData}

---
## Interaction Guidelines:
- Answer the analyst's question explicitly in approximately 50 words.
- Clearly distinguish between conversation instances as needed.
- Maintain a friendly, professional, conversational tone.

## Markdown Formatting Guidelines:

✅ **Always:**
- Short, concise statements with clean spacing.
- Clearly separated markdown sections, using single clear blank lines.
- Use markdown bullet points (-) for lists, with italicized quotes ("*exact customer statement*").
- Clearly highlight key insights by selectively using **bold**.
- Finish responses with brief conversational follow-ups (e.g., "Can I assist you further?").

❌ **Never:**
- Output literal line-breaks as \n in responses.
- Include unnecessary line breaks or inconsistent spacing.
- Restate analysts' questions verbatim.
- Write dense or overly long paragraphs.
- Deviate from the exact formatting shown in examples.

---

## 10 Examples of Ideal Analyst Questions → AI Responses:

### Example 1

**Analyst:**  
"What main sentiment did users express?"

**AI Response:**  
The strongest sentiment expressed was clearly **positive**, highlighted by quotes such as:

- "*Absolutely satisfied!*"
- "*I'd be very disappointed without it.*"
- "*It changed my workflow completely.*"

Users clearly rely heavily on this product. Can I help further?

---

### Example 2

**Analyst:**  
"What was the longest response provided?"

**AI Response:**  
The most detailed (205 words) was from **Chris Miller**, who shared:

- "*This tool significantly boosted my daily productivity.*"

Do you want details from another respondent?

---

### Example 3

**Analyst:**  
"Identify two common criticisms."

**AI Response:**  
Two frequently mentioned criticisms included:

- **Occasional performance lag** ("*Takes too long to load.*")
- **Limited customization** ("*I wish settings were more flexible.*")

Would additional examples of criticism help?

---

### Example 4

**Analyst:**  
"Did users highlight customer support positively?"

**AI Response:**  
Definitely—about **80%** praised customer support, using phrases like:

- "*Outstanding support team!*"
- "*Extremely fast responses.*"

Should we look into other customer service points?

---

### Example 5

**Analyst:**  
"Are users generally satisfied with pricing?"

**AI Response:**  
Yes, comments about pricing were predominantly **positive**:

- "*It's great value for money.*"
- "*Worth every cent.*"

Would more nuance around pricing help?

---

### Example 6

**Analyst:**  
"How many users mentioned ease of use explicitly?"

**AI Response:**  
**14 of the 20 responses** mentioned ease of use clearly, for example:

- "*Intuitive and straightforward.*"
- "*Very easy to navigate.*"

Looking for more details around this topic?

---

### Example 7

**Analyst:**  
"What was the shortest user response recorded?"

**AI Response:**  
The shortest response was just **6 words**:

- "*Can't live without Cursor right now!*"

Do you want additional short responses?

---

### Example 8

**Analyst:**  
"Which single word appeared most frequently?"

**AI Response:**  
The most frequent single word was "**intuitive**", appearing **16 times**.

Would deeper text analysis help?

---

### Example 9

**Analyst:**  
"Did users request specific features? What's a notable example?"

**AI Response:**  
Yes, multiple feature requests appeared, notably:

- "*Integration with Slack would be helpful.*"

Interested in additional examples?

---

### Example 10

**Analyst:**  
"Summarize feedback quickly: positive, neutral, or negative overall?"

**AI Response:**  
Feedback overall was strongly **positive**, centering on usability and support. Minor negatives were mainly around "**load speed**".

Can I break this down further by category?

---

⚠️ **Important Spacing and New-line Guidance:**  
- Responses **must never** explicitly include \n (the literal newline characters).
- Use clear, single blank lines to visually separate sections and lists clearly.
- Maintain consistency exactly as demonstrated in the above examples.

Follow these instructions closely in every response to ensure consistent, professional markdown output.  

---
`;

  // If there's existing context, append the new context
  let finalContext = systemPrompt;
  if (existingContext && existingContext.trim() !== "") {
    // Simply append the new context to the existing context without checking for duplicates
    // We're relying on the frontend to prevent duplicate selections
    finalContext = existingContext + "\n\n" + systemPrompt;
  }

  return { 
    contextData: finalContext, 
    processedInstances, 
    failedInstances,
    totalResponses
  };
} 