import RootLayout from "@/components/custom-ui/nav"
import { Chat } from "@/components/chat-ui/chat"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function CreateConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <RootLayout>
      <div className="h-full bg-background">
        <Chat conversationId={params.id} />
      </div>
    </RootLayout>
  )
}
