import {
  Search,
  User,
  CreditCard,
  Star,
  Wrench,
  Lightbulb,
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
  whyFoundersCare: string
  cachedFirstResponse: string
}

export const agentsData: Agent[] = [
  {
    id: "AGENT01",
    name: "Discovery Trigger",
    benefit: "Discovery Trigger",
    prompt: "How did you hear about {organisation_name}?",
    description: "Learn where they heard about you and what first caught their interest",
    Icon: Search,
    color: "cyan",
    initialQuestion: "How did you first discover {organisation_name}?",
    whyFoundersCare: "Tells founders: Where should we spend marketing dollars?",
    cachedFirstResponse: "Thanks for joining! We'll keep this short and sharp! To start, how did you first hear about {organisation_name}?",
  },
  {
    id: "AGENT02", 
    name: "Persona + Problem",
    benefit: "Persona + Problem",
    prompt: "Tell us about you and the problem you're solving.",
    description: "Captures the user's role, work environment, and the problem {product} helps them solve.",
    Icon: User,
    color: "amber",
    initialQuestion: "Could you tell us a bit about your role and the main challenge you're trying to solve?",
    whyFoundersCare: "Tells founders: Who are we winning with and why?",
    cachedFirstResponse: "Thanks for joining! We'll keep this short and sharp! To start, could you tell me yourself and what you hoped {organisation_name} would help you achieve?",
  },
  {
    id: "AGENT03",
    name: "Activation Hurdles", 
    benefit: "Activation Hurdles",
    prompt: "When you think about the paid plan, what (if anything) has given you pause?",
    description: "Find the key hesitation blocking upgrade from free to paid",
    Icon: CreditCard,
    color: "red",
    initialQuestion: "What's your main consideration when thinking about upgrading to a paid plan?",
    whyFoundersCare: "Tells founders: What will make our free users pay and our paid users stay even longer?",
    cachedFirstResponse: "Thanks for joining! We'll keep this short and sharp! Thinking about the actually paying for {organisation_name}, did anything give you pause—or maybe push you to say 'yes' right away?",
  },
  {
    id: "AGENT04",
    name: "Key Benefit",
    benefit: "Key Benefit", 
    prompt: "What do you love most about {organisation_name}?",
    description: "Finds the single biggest benefit customers get from our product and uncovers why it matters.",
    Icon: Star,
    color: "green",
    initialQuestion: "What's the main thing you love about using {organisation_name}?",
    whyFoundersCare: "Tells founders: What's driving the most value for our customers?",
    cachedFirstResponse: "Thanks for joining! We'll keep this short and sharp! To start, what's the single thing you love most about {organisation_name}?",
  },
  {
    id: "AGENT05",
    name: "Improvements & Friction",
    benefit: "Improvements & Friction",
    prompt: "How could we improve {product} for you?", 
    description: "Surfaces the top product gap users face, then digs into root causes and why it's a gap.",
    Icon: Wrench,
    color: "blue",
    initialQuestion: "If you could improve one thing about {product}, what would it be?",
    whyFoundersCare: "Tells founders: What's driving support tickets and tomorrow's churn?",
    cachedFirstResponse: "Thanks for joining! We'll keep this short and sharp! To start, what's the one thing we could do to improve {organisation_name} for you?",
  },
  {
    id: "AGENT06",
    name: "Feature Wishlist",
    benefit: "Feature Wishlist",
    prompt: "What feature should we build next?",
    description: "Pinpoints the feature users want next and explores the problem it would solve.",
    Icon: Lightbulb,
    color: "violet", 
    initialQuestion: "What new feature would be most valuable to you right now?",
    whyFoundersCare: "Tells founders: What should we build next that users actually want?",
    cachedFirstResponse: "Thanks for joining! We'll keep this short and sharp! So, which feature would you love us to build next for {organisation_name}?",
  },
] 