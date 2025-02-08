import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { generateUUID } from "@/lib/utils";
import { createChatInstance } from "@/db/queries/chat-instances-queries";

export default async function ChatPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect("/login");
  }

  // Create a new chat instance with properly stringified empty messages array
  const chatId = generateUUID();
  const emptyMessages = JSON.stringify([]);
  
  try {
    await createChatInstance({
      id: chatId,
      userId: user.id,
      messages: emptyMessages,
    });
  } catch (error) {
    console.error("Failed to create chat instance:", error);
    throw new Error("Failed to create chat instance");
  }

  // Redirect to the new chat
  redirect(`/chat/${chatId}`);
} 