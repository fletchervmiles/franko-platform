import { AlertCircle, Target, MessageSquare, TrendingUp, CheckSquare } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

export const SUMMARY_SECTIONS: {
  [key: string]: {
    title: string;
    content: string;
    icon: LucideIcon;
  }
} = {
  reasonForCanceling: {
    title: "REASON FOR CANCELING",
    content: "Fletcher canceled his subscription primarily due to **lack of expected energy boost** and **taste preferences**.",
    icon: AlertCircle
  },
  desiredBenefit: {
    title: "DESIRED BENEFIT",
    content: "Fletcher was seeking **improved afternoon focus** and **sustained energy**.",
    icon: Target
  },
  customerFeedback: {
    title: "CUSTOMER FEEDBACK",
    content: "The customer expressed **dissatisfaction with the flavor**.",
    icon: MessageSquare
  },
  winBackAnalysis: {
    title: "WIN BACK ANALYSIS",
    content: "There's a **high potential for win-back**.",
    icon: TrendingUp
  },
  actionSteps: {
    title: "ACTION STEPS",
    content: "1. **Send flavor sampling kit**\n2. **Share user testimonials**",
    icon: CheckSquare
  }
}; 