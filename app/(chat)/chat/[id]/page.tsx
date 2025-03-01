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
 * 5. Render chat → Chat component
 */

import { Message } from "ai";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ChatWrapper } from "@/components/chat-wrapper";
import { NavSidebar } from "@/components/nav-sidebar";
import { getChatInstanceById, createChatInstance } from "@/db/queries/chat-instances-queries";
import { type SelectChatInstance } from "@/db/schema/chat-instances-schema";

type ChatWithMessages = Omit<SelectChatInstance, 'messages'> & { messages: Message[] };

/**
 * Chat Page
 * @param {object} params - URL parameters containing chat ID
 * 
 * Security Checks:
 * 1. User is authenticated
 * 2. For existing chats:
 *    - Chat exists
 *    - User owns the chat
 * 3. For new chats:
 *    - Create chat instance
 *    - Initialize with empty messages
 */
export default async function Page({ params }: { params: { id: string } }) {
  // Get user session for authentication
  const { userId } = await auth();

  // Return 404 if user is not authenticated
  if (!userId) {
    return notFound();
  }

  const { id } = params;
  let chat: ChatWithMessages;

  try {
    // Attempt to fetch existing chat from database
    const chatFromDb = await getChatInstanceById(id);

    // If chat exists, verify ownership
    if (chatFromDb) {
      if (userId !== chatFromDb.userId) {
        return notFound(); // User doesn't own this chat
      }

      // Convert messages to UI format
      chat = {
        ...chatFromDb,
        messages: chatFromDb.messages ? JSON.parse(chatFromDb.messages) : []
      };
    } else {
      // Create new chat instance
      const emptyMessages = JSON.stringify([]);
      const newChat = await createChatInstance({
        id,
        userId,
        messages: emptyMessages
      });

      chat = {
        ...newChat,
        messages: []
      };
    }

    return (
      <NavSidebar>
        <ChatWrapper conversationId={chat.id} initialMessages={chat.messages} />
      </NavSidebar>
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
