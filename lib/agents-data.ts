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
  initialQuestion: string
  whyFoundersCare: string
}

export const agentsData: Agent[] = [
  {
    id: "AGENT04",
    name: "Key Benefit",
    benefit: "Key Benefit", 
    prompt: "What do you love most about {organisation_name}?",
    description: "Find {organisation_name}'s strongest selling points and why those matter to your users.",
    Icon: Star,
    initialQuestion: "What's the main thing you love about using {organisation_name}?",
    whyFoundersCare: "Clarify your product's strongest selling points to amplify value and messaging.",

  },
  {
    id: "AGENT05",
    name: "Improvements & Friction",
    benefit: "Improvements & Friction",
    prompt: "How could we improve {organisation_name} for you?", 
    description: "Pinpoint {organisation_name}'s biggest friction points to proactively reduce churn.",
    Icon: Wrench,
    initialQuestion: "If you could improve one thing about {organisation_name}, what would it be?",
    whyFoundersCare: "Pinpoint exactly what's driving customer frustration to reduce support tickets and churn.",

  },
  {
    id: "AGENT03",
    name: "Activation Hurdles", 
    benefit: "Activation Hurdles",
    prompt: "When you think about the paid plan, what (if anything) has given you pause?",
    description: "Discover what's preventing paid upgrades, so you can fix your conversion funnel.",
    Icon: CreditCard,
    initialQuestion: "What's your main consideration when thinking about upgrading to a paid plan?",
    whyFoundersCare: "Discover exactly what drives upgrades and prevents churn, so you can optimize conversions.",
  },
  {
    id: "AGENT02", 
    name: "Persona + Problem",
    benefit: "Persona + Problem",
    prompt: "Tell us about you and the problem you're solving.",
    description: "Identify your ideal customers, their roles, and the core problems your product solves.",
    Icon: User,
    initialQuestion: "Could you tell us a bit about your role and the main challenge you're trying to solve?",
    whyFoundersCare: "Identify your ideal customers and the core problems you're successfully addressing.",
  },
  {
    id: "AGENT01",
    name: "Discovery Trigger",
    benefit: "Discovery Trigger",
    prompt: "How did you hear about {organisation_name}?",
    description: "Learn where users find {organisation_name} and what catches their interest.",
    Icon: Search,
    initialQuestion: "How did you first discover {organisation_name}?",
    whyFoundersCare: "Understand exactly where to invest your marketing budget for maximum impact.",
  },
  {
    id: "AGENT06",
    name: "Feature Wishlist",
    benefit: "Feature Wishlist",
    prompt: "What feature should we build next?",
    description: "Surface feature requests and understand the user needs driving them.",
    Icon: Lightbulb,
    initialQuestion: "What new feature would be most valuable to you right now?",
    whyFoundersCare: "Reveal which feature your users truly want next to prioritize development effectively.",
  },
];