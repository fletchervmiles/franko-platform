import RootLayout from "@/components/custom-ui/nav"
import InterviewDashboard from "@/components/custom-ui/interview-dashboard"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <RootLayout>
      <div className="min-h-screen bg-background">
        <InterviewDashboard userId={userId} />
      </div>
    </RootLayout>
  )
}
