import RootLayout from "@/components/custom-ui/demoNav"
import InterviewDashboard from "@/components/custom-ui/interview-dashboard"

export default function DemoDashboardPage() {
  const userId = "user_demo_account"
  
  return (
    <RootLayout>
      <div className="min-h-screen bg-background">
        <InterviewDashboard 
          userId={userId} 
          isDemoRoute={true}
        />
      </div>
    </RootLayout>
  )
}
