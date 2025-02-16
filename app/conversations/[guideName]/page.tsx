import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ConversationPageClient } from "../../../components/conversation-page-client"

export default async function ConversationPage({ params }: { params: { guideName: string } }) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return <ConversationPageClient params={params} userId={userId} />
}

