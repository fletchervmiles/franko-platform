/**
 * Chat Page Component
 * 
 * This is a server component that handles:
 * 1. Chat instance verification
 * 2. Chat response creation
 * 3. Message format conversion
 * 
 * Data Flow:
 * 1. URL params → Chat ID
 * 2. Database query → Chat instance data
 * 3. Create chat response → New response record
 * 4. Format conversion → UI messages
 * 5. Render chat → Chat component
 */

import { Message } from "ai";
import { notFound } from "next/navigation";
import { ChatWrapper } from "@/components/chat-wrapper";
import { getChatInstanceById } from "@/db/queries/chat-instances-queries";
import { createChatResponse, getChatResponseById } from "@/db/queries/chat-responses-queries";
import { type SelectChatInstance } from "@/db/schema/chat-instances-schema";
import { generateUUID } from "@/lib/utils";

type ChatWithMessages = Omit<SelectChatInstance, 'messages'> & { messages: Message[] };

/**
 * Chat Page
 * @param {object} params - URL parameters containing chat ID
 * 
 * Flow:
 * 1. Verify chat instance exists
 * 2. Create a new chat response linked to the instance
 * 3. Initialize with empty messages
 * 4. Render the chat interface
 */
export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  let chat: ChatWithMessages;

  try {
    // Attempt to fetch existing chat instance from database
    const chatFromDb = await getChatInstanceById(id);

    // If chat doesn't exist, return 404
    if (!chatFromDb) {
      return notFound();
    }

    // Create a new chat response for this instance
    const responseId = generateUUID();
    const emptyMessages = JSON.stringify([]);
    
    // Create new chat response linked to this instance
    await createChatResponse({
      id: responseId,
      chatInstanceId: id,
      userId: chatFromDb.userId, // Using instance owner's ID for tracking
      messagesJson: emptyMessages,
      status: "started",
      completionStatus: "incomplete",
    });

    // Format chat for UI
    chat = {
      ...chatFromDb,
      messages: []
    };

    return (
      <div className="h-full flex flex-col">
        <ChatWrapper conversationId={responseId} initialMessages={chat.messages} chatInstanceId={id} />
      </div>
    );
  } catch (error) {
    console.error("Error loading chat:", error);
    return notFound();
  }
}

/**
 * Component Integration:
 * 
 * 1. Database (db/queries):
 *    - Fetches chat data using getChatInstanceById
 *    - Returns messages in database format
 * 
 * 2. Authentication (auth):
 *    - Verifies user session
 *    - Provides user identity
 * 
 * 3. Message Conversion (lib/utils):
 *    - Transforms database messages to UI format
 *    - Maintains type safety
 * 
 * 4. Chat Component (components/chat):
 *    - Receives formatted data
 *    - Handles real-time updates
 *    - Manages user interactions
 */
