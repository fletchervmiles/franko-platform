import { NavSidebar } from "@/components/nav-sidebar"
import { InternalChatWrapper } from "@/components/internal-chat-wrapper"
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation"
import { getInternalChatSessionById } from "@/db/queries/internal-chat-sessions-queries"
import { Message } from "ai"

interface ResponseQASessionPageProps {
  params: {
    id: string
  }
}

export default async function ResponseQASessionPage({ params }: ResponseQASessionPageProps) {
  const { userId } = await auth()
  
  // Redirect to login if not authenticated
  if (!userId) {
    redirect("/sign-in")
  }
  
  const { id } = params
  
  // Fetch session data
  const session = await getInternalChatSessionById(id)
  
  // Redirect to main page if session not found or not owned by user
  if (!session || session.userId !== userId) {
    redirect("/response-qa")
  }
  
  // Parse initial messages if any
  let initialMessages: Message[] = []
  if (session.messagesJson) {
    try {
      initialMessages = JSON.parse(session.messagesJson as string)
    } catch (error) {
      console.error("Error parsing messages:", error)
      // Continue with empty messages
    }
  }
  
  return (
    <NavSidebar>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">{session.title}</h1>
        </div>
        <div className="flex-grow overflow-hidden">
          <InternalChatWrapper
            internalChatSessionId={id}
            initialMessages={initialMessages}
          />
        </div>
      </div>
    </NavSidebar>
  )
}