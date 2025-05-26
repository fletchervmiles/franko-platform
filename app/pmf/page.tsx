import { FeedbackProvider } from "@/contexts/feedback-context";
import { NavSidebar } from "@/components/nav-sidebar";
import dynamic from 'next/dynamic';

const PMFScoreCard = dynamic(() => import("@/components/pmf/pmf-score-card").then(mod => mod.PMFScoreCard), { ssr: false });
const PersonaSelector = dynamic(() => import("@/components/pmf/persona-selector").then(mod => mod.PersonaSelector), { ssr: false });
const ResponseDistributionChart = dynamic(() => import("@/components/pmf/response-distribution-chart").then(mod => mod.ResponseDistributionChart), { ssr: false });
const TrendChart = dynamic(() => import("@/components/pmf/pmf-trend-chart").then(mod => mod.TrendChart), { ssr: false });

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
