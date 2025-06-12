import {
  Star,
  Wrench,
  Lightbulb,
  User,
  DollarSign,
  RefreshCw,
  TrendingUp,
  PenSquare,
  Frown,
  Handshake,
  type LucideIcon,
} from "lucide-react"

export type Agent = {
  id: string
  name: string
  benefit: string
  prompt: string
  description: string
  Icon: LucideIcon
  color: "green" | "blue" | "violet" | "amber" | "red" | "orange" | "cyan" | "gray" | "purple" | "emerald"
  initialQuestion: string
}

export const agentsData: Agent[] = [
  {
    id: "AGENT01",
    name: "Key Benefit",
    benefit: "Reviews & Surveys",
    prompt: "What do you love most about using our product?",
    description: "Finds the single biggest benefit customers get from our product and uncovers why it matters.",
    Icon: Star,
    color: "green",
    initialQuestion: "To start, what's the primary reason you chose our product over others?",
  },
  {
    id: "AGENT02",
    name: "Improvement / Friction",
    benefit: "Improvement",
    prompt: "How could we improve our product for you?",
    description: "Surfaces the top product gap users face, then digs into root causes and why it's a gap.",
    Icon: Wrench,
    color: "blue",
    initialQuestion: "If you could change one thing about our product to make it better, what would it be?",
  },
  {
    id: "AGENT03",
    name: "Feature Preference",
    benefit: "Feature Preference",
    prompt: "What should we build next?",
    description: "Pinpoints the feature users want next and explores the problem it would solve.",
    Icon: Lightbulb,
    color: "violet",
    initialQuestion: "We're planning our roadmap. What new feature would be most valuable to you right now?",
  },
  {
    id: "AGENT04",
    name: "Persona & Use Case",
    benefit: "Persona & Use Case",
    prompt: "Tell us a little about you and the problem you're solving.",
    description: "Captures the user's role, work environment, and the problem our product helps them tackle.",
    Icon: User,
    color: "amber",
    initialQuestion: "Could you briefly describe your role and the main task you use our product for?",
  },
  {
    id: "AGENT05",
    name: "Pricing Check",
    benefit: "Pricing Check",
    prompt: "How do you feel about the value vs. price of our product?",
    description: "Tests perceived value versus price and gathers the thinking behind that perception.",
    Icon: DollarSign,
    color: "red",
    initialQuestion:
      "Considering the price, how would you rate the value you get from our product on a scale of 1 to 10?",
  },
  {
    id: "AGENT06",
    name: "Churn Signal",
    benefit: "Churn Signal",
    prompt: "If you stopped using our product, what would your reason be?",
    description: "Identifies reasons customers might leave and probes for the context behind them.",
    Icon: RefreshCw,
    color: "orange",
    initialQuestion:
      "Hypothetically, what's one reason that might cause you to look for an alternative to our product?",
  },
  {
    id: "AGENT07",
    name: "Acquisition",
    benefit: "Acquisition",
    prompt: "How did you first find out about our company?",
    description: "Traces how users first discovered our company and captures the full discovery journey.",
    Icon: TrendingUp,
    color: "cyan",
    initialQuestion: "I'm curious, how did you first hear about us?",
  },
  {
    id: "AGENT08",
    name: "Open Feedback",
    benefit: "Open Feedback",
    prompt: "Anything else on your mind? Let us know :)",
    description: "Opens the floor to any idea or issue, then follows up for details and context.",
    Icon: PenSquare,
    color: "gray",
    initialQuestion: "Is there anything else you'd like to share? No topic is too big or too small.",
  },
  {
    id: "AGENT09",
    name: "Disappointment Level",
    benefit: "Disappointment Level",
    prompt: "How disappointed would you be without our product?",
    description:
      "Measures how essential our product is by asking how disappointed they'd be without it, then determines why.",
    Icon: Frown,
    color: "purple",
    initialQuestion:
      "How would you feel if you could no longer use our product? (e.g., Very disappointed, Somewhat disappointed, Not disappointed)",
  },
  {
    id: "AGENT10",
    name: "Ideal User",
    benefit: "Ideal User",
    prompt: "Who do you think benefits most from using our product?",
    description: "Captures persona type and the main benefit received from our product.",
    Icon: Handshake,
    color: "emerald",
    initialQuestion: "In your opinion, what kind of person or team gets the most value out of our product?",
  },
] 