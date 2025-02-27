import { NavSidebar } from "@/components/nav-sidebar"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { CreateConversationForm } from "@/components/create-conversation-form"

export default async function CreatePage({ params }: { params: { id: string } }) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  // If the ID is not 'new', redirect to the workspace
  if (params.id !== 'new') {
    redirect("/workspace")
  }

  return (
    <NavSidebar>
      <div className="h-full p-4 md:p-8 lg:p-12">
        <div className="w-full">
          <h1 className="text-2xl font-semibold mb-2">Create a new conversation</h1>
          <p className="text-gray-600 mb-8">
            Provide the details of what you want, and we'll generate your conversation plan.
          </p>
          
          <CreateConversationForm />
        </div>
      </div>
    </NavSidebar>
  )
}
