import RootLayout from "@/components/custom-ui/nav"
import InterviewDashboard from "@/components/custom-ui/interview-dashboard"


export default function DashboardPage() {
  return (
    <RootLayout>
      <div className="min-h-screen bg-background">
        <InterviewDashboard />
      </div>
    </RootLayout>
  )
}
