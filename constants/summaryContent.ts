import { AlertCircle, Target, MessageSquare, TrendingUp, CheckSquare, FileText } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

export type SummarySection = {
  title: string;
  field: string; // database field name
  icon: LucideIcon;
}

export const SUMMARY_SECTIONS: { [key: string]: SummarySection } = {
  summary: {
    title: "Summary",
    field: "analysisPart01",
    icon: FileText
  },
  reasonForCanceling: {
    title: "Reason for Canceling",
    field: "analysisPart02",
    icon: AlertCircle
  },
  desiredBenefit: {
    title: "Desired Benefit",
    field: "analysisPart03",
    icon: Target
  },
  customerFeedback: {
    title: "Customer Feedback",
    field: "analysisPart04",
    icon: MessageSquare
  },
  winBackAnalysis: {
    title: "Win Back Analysis",
    field: "analysisPart05",
    icon: TrendingUp
  },
  actionSteps: {
    title: "Action Steps",
    field: "analysisPart06",
    icon: CheckSquare
  }
} 