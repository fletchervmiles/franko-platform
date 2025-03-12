import { NavSidebar } from "@/components/nav-sidebar"
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
  const { id } = params
  const { userId } = await auth()
  
  // Redirect to login if not authenticated
  if (!userId) {
    redirect("/sign-in")
  }
  
  // Fetch session data to validate it exists and belongs to the user
  const session = await getInternalChatSessionById(id)
  
  // Redirect if session not found or doesn't belong to this user
  if (!session || session.userId !== userId) {
    console.error("Session not found or unauthorized", { id, userId });
    redirect("/response-qa")
  }
  
  // Redirect to the main page with a session ID query parameter
  // This allows us to maintain existing links but use our integrated approach
  redirect(`/response-qa?sessionId=${id}`)
}