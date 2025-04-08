import { NavSidebar } from "@/components/nav-sidebar"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { CreateConversationForm } from "@/components/create-conversation-form"
import { getChatInstanceById } from "@/db/queries/chat-instances-queries"

export default async function CreatePage({ params, searchParams }: { params: { id: string }, searchParams: { regenerate?: string } }) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  // Check if we're regenerating
  const isRegenerating = searchParams.regenerate === 'true'

  // For 'new' route, just render the form
  // For existing IDs, verify the chat instance exists and belongs to the user
  if (params.id !== 'new') {
    const chatInstance = await getChatInstanceById(params.id)
    if (!chatInstance || chatInstance.userId !== userId) {
      redirect("/workspace")
    }
  }

  return (
    <NavSidebar>
      <div className="h-full p-4 md:p-8 lg:p-12">
        <div className="w-full">
          <h1 className="text-2xl font-semibold mb-2">
            {isRegenerating ? "Regenerate Conversation Plan" : "Create a New Conversation Plan"}
          </h1>
          <p className="text-gray-600 mb-8">
          The conversation plan provides essential context and learning objectives, guiding your agent during conversations.
          </p>
          
          <CreateConversationForm 
            isNew={params.id === 'new'} 
            idProp={params.id !== 'new' ? params.id : undefined}
            isRegenerating={isRegenerating}
          />
        </div>
      </div>
    </NavSidebar>
  )
}
