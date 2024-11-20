import RootLayout from "@/components/custom-ui/nav"
import InterviewContainer from "@/components/custom-ui/interview-container"

export default function DashboardPage() {
  return (
    <RootLayout>
      <div className="min-h-screen bg-background">
        <InterviewContainer />
      </div>
    </RootLayout>
  )
}
