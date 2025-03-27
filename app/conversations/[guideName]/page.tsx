import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import dynamic from "next/dynamic"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

// Simple loading indicator component for the page level Suspense
const PageLoadingIndicator = () => (
  <div className="w-full h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
  </div>
)

// Dynamically import ConversationPageClient with code splitting
const ConversationPageClient = dynamic(
  () => import("../../../components/conversation-page-client").then(mod => ({ default: mod.ConversationPageClient })),
  {
    loading: () => <PageLoadingIndicator />,
    ssr: false
  }
)

export default async function ConversationPage({ params }: { params: { guideName: string } }) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <Suspense fallback={<PageLoadingIndicator />}>
      <ConversationPageClient params={params} userId={userId} />
    </Suspense>
  )
}