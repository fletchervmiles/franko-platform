import { FeedbackProvider } from "@/contexts/feedback-context";
import { PMFScoreCard } from "@/components/pmf/pmf-score-card"
import { PersonaSelector } from "@/components/pmf/persona-selector"
import { ResponseDistributionChart } from "@/components/pmf/response-distribution-chart"
import { TrendChart } from "@/components/pmf/pmf-trend-chart"
import { NavSidebar } from "@/components/nav-sidebar";

export default function PMFPage() {
  return (
    <NavSidebar>
      <FeedbackProvider>
        <div className="p-4 md:p-8 lg:p-12">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Product-Market Fit Dashboard</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PMFScoreCard />
            <PersonaSelector />
            <ResponseDistributionChart />
            <TrendChart />
          </div>
        </div>
      </FeedbackProvider>
    </NavSidebar>
  )
}
