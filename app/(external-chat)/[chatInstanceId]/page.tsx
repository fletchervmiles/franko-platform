/**
 * External Chat Page Component
 * 
 * This is a server component that handles:
 * 1. Chat instance retrieval
 * 2. Organization context loading
 * 3. Chat response initialization
 * 4. Error handling
 * 
 * Data Flow:
 * 1. URL params → Chat Instance ID
 * 2. Database query → Chat instance data + org data
 * 3. Initialize chat response
 * 4. Render external chat component
 */

import { Message } from "ai";
import { notFound } from "next/navigation";
import { getChatInstanceById } from "@/db/queries/chat-instances-queries";
import { getProfile } from "@/db/queries/profiles-queries";
import { createChatResponse } from "@/db/queries/chat-responses-queries";
import { ExternalChatWrapper } from "../../../components/external-chat-wrapper";
import { type SelectChatInstance } from "@/db/schema/chat-instances-schema";
import { generateUUID } from "@/lib/utils";

interface ExternalChatPageProps {
  params: {
    chatInstanceId: string;
  };
}

export default async function ExternalChatPage({ params }: ExternalChatPageProps) {
  const { chatInstanceId } = params;
  
  try {
    // Fetch chat instance
    const chatInstance = await getChatInstanceById(chatInstanceId);
    if (!chatInstance) {
      return notFound();
    }

    // Fetch organization context
    const profile = await getProfile(chatInstance.userId);
    if (!profile) {
      return notFound();
    }

    // Initialize chat response if needed
    const chatResponseId = generateUUID();
    const initialMessages: Message[] = [];
    
    await createChatResponse({
      id: chatResponseId,
      userId: chatInstance.userId,
      chatInstanceId: chatInstance.id,
      status: "in_progress",
      messagesJson: JSON.stringify(initialMessages),
      completionStatus: "not_started"
    });

    return (
      <div className="flex min-h-screen flex-col">
        <ExternalChatWrapper 
          chatInstanceId={chatInstance.id}
          chatResponseId={chatResponseId}
          initialMessages={initialMessages}
          organizationName={profile.organisationName || ""}
          organizationContext={profile.organisationDescription || ""}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading external chat:", error);
    return notFound();
  }
}
