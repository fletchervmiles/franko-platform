import { NavSidebar } from "@/components/nav-sidebar"
import { ResponseQALanding } from "@/components/response-qa-landing"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { InternalChatSessionsList } from "@/components/internal-chat-sessions-list"

export default async function ResponseQAPage() {
  const { userId } = await auth()
  
  // Redirect to login if not authenticated
  if (!userId) {
    redirect("/sign-in")
  }
  
  return (
    <NavSidebar>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Response Analysis</h1>
          <p className="text-sm text-muted-foreground">
            Ask questions about your collected responses
          </p>
        </div>
        <div className="flex-grow overflow-hidden">
          <ResponseQALanding userId={userId} />
        </div>
      </div>
    </NavSidebar>
  )
}
