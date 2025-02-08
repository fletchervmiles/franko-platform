/**
 * Chat Page Component
 * 
 * This is a server component that handles:
 * 1. Chat retrieval from database
 * 2. Authentication verification
 * 3. Message format conversion
 * 4. Authorization checks
 * 
 * Data Flow:
 * 1. URL params → Chat ID
 * 2. Database query → Chat data
 * 3. Auth check → User session
 * 4. Format conversion → UI messages
 * 5. Render chat → PreviewChat component
 */

import { CoreMessage, Message } from "ai";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { Chat as PreviewChat } from "@/components/custom/chat";
import { getChatById } from "@/db/queries/queries";
import { type SelectChatInstance } from "@/db/schema";
import { convertToUIMessages } from "@/lib/utils";

type ChatWithMessages = Omit<SelectChatInstance, 'messages'> & { messages: Message[] };

/**
 * Chat Page
 * @param {object} params - URL parameters containing chat ID
 * 
 * Security Checks:
 * 1. Chat exists
 * 2. User is authenticated
 * 3. User owns the chat
 * 
 * Message Processing:
 * - Converts database messages to UI format
 * - Maintains type safety with CoreMessage
 */
export default async function Page({ params }: { params: any }) {
  // Extract chat ID from URL parameters
  const { id } = params;
  
  // Attempt to fetch chat from database
  const chatFromDb = await getChatById({ id });

  // Return 404 if chat doesn't exist
  if (!chatFromDb) {
    notFound();
  }

  // Convert database messages to UI format
  // This ensures compatibility with the PreviewChat component
  let parsedMessages = [];
  try {
    parsedMessages = chatFromDb.messages ? JSON.parse(chatFromDb.messages) : [];
  } catch (error) {
    console.error("Failed to parse messages:", error);
    parsedMessages = [];
  }
  
  const chat: ChatWithMessages = {
    ...chatFromDb,
    messages: convertToUIMessages(parsedMessages),
  };

  // Get user session for authentication
  const { userId } = await auth();

  // Return 404 if user is not authenticated
  if (!userId) {
    return notFound();
  }

  // Return 404 if user doesn't own the chat
  // This prevents unauthorized access to other users' chats
  if (userId !== chat.userId) {
    return notFound();
  }

  // Render the chat component with initial data
  return <PreviewChat id={chat.id} initialMessages={chat.messages} />;
}

/**
 * Component Integration:
 * 
 * 1. Database (db/queries):
 *    - Fetches chat data using getChatById
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
 * 4. Chat Component (components/custom/chat):
 *    - Receives formatted data
 *    - Handles real-time updates
 *    - Manages user interactions
 */
