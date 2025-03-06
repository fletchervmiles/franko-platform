import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import dynamic from "next/dynamic"
import { Suspense } from "react"
import { LoadingScreen } from "@/components/loading-screen"

// Dynamically import ConversationPageClient with code splitting
const ConversationPageClient = dynamic(
  () => import("../../../components/conversation-page-client").then(mod => ({ default: mod.ConversationPageClient })),
  {
    loading: () => <LoadingScreen message="Loading conversation..." />,
    ssr: false
  }
)

export default async function ConversationPage({ params }: { params: { guideName: string } }) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <Suspense fallback={<LoadingScreen message="Loading conversation interface..." />}>
      <ConversationPageClient params={params} userId={userId} />
    </Suspense>
  )
}