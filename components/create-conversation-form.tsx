"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { 
  Users, 
  Target, 
  BarChart2, 
  UserPlus, 
  MessageSquare, 
  DollarSign,
  ChevronRight,
  Loader2,
  AlertTriangle
} from "lucide-react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import LoadingScreen from "./loading-screen"
import { useQuotaAvailability } from "@/hooks/use-quota-availability"

// Status indicator component
const StatusDot = ({ active }: { active: boolean }) => (
  <span 
    className={cn(
      "inline-block w-2 h-2 rounded-full ml-2",
      active ? "bg-green-500" : "bg-yellow-500"
    )} 
  />
)

// Template interface
interface Template {
  title: string
  prompt: string
  icon: React.ComponentType<{ className?: string }>
}

// Templates for each category
const productTemplates: Template[] = [
  {
    title: "Product-Market Fit Discovery",
    prompt: "I want to find out \n- how disappointed customers would be if they could no longer use our product\n- figure out the key benefit or reason that they use our product (figure out in what circumstances they use it, i.e. persona)\n- discover in their own words who our customers think is the ideal user of our product \n- uncover improvements that are likely to increase customer satisfaction and retention",
    icon: Target
  },
  {
    title: "Feature Importance & Prioritization",
    prompt: "I want to understand exactly which features customers value most (and least)—so we can clearly prioritize future improvements and strategically shape our product roadmap.",
    icon: BarChart2
  },
  {
    title: "Usability & Friction Points",
    prompt: "I want clear insights into what parts of our product's user experience cause confusion, frustration, or friction, so we know exactly where to smooth the experience and improve usability.",
    icon: MessageSquare
  },
  {
    title: "Customer \"Aha!\" Moments",
    prompt: "I want to discover the specific moments or experiences where customers first find meaningful value in our product—so we can clearly optimize onboarding and activation flows around these experiences.",
    icon: Users
  },
  {
    title: "Expectations vs. Reality",
    prompt: "I want to learn how customer expectations before using our product compare to their actual experience—revealing any gaps or mismatches that we can solve through better messaging or targeted improvements.",
    icon: DollarSign
  }
]

const marketingTemplates: Template[] = [
  {
    title: "Competitive Differentiation & Switching Drivers",
    prompt: "I want to clearly understand why customers choose our product over competitors, what unique advantages they see in us, and what might cause them to switch—giving us deep clarity to strengthen our unique positioning.",
    icon: Target
  },
  {
    title: "Messaging & Clarity Check",
    prompt: "I want to learn directly from customers what parts of our messaging resonate clearly and what might feel confusing or vague—so we can sharpen our core communication.",
    icon: BarChart2
  },
  {
    title: "Brand Perception & Authenticity",
    prompt: "I want to understand how customers genuinely perceive our brand personality and identity, uncovering opportunities to build greater authenticity and alignment.",
    icon: Users
  },
  {
    title: "Decision Drivers & Buying Criteria",
    prompt: "I want to pinpoint the exact criteria and motivations customers used when selecting our product—so we can reinforce these core drivers clearly in marketing and sales.",
    icon: MessageSquare
  }
]

const salesTemplates: Template[] = [
  {
    title: "Price Sensitivity & Willingness-To-Pay",
    prompt: "I want to understand how our customers perceive the value of our product and clearly learn their true willingness-to-pay—so we can price strategically and confidently.",
    icon: MessageSquare
  },
  {
    title: "Feature Value Analysis",
    prompt: "I want to identify the product features customers truly value most (and least)—helping us align pricing tiers, justify pricing changes, and ensure we're maximizing impact.",
    icon: DollarSign
  },
  {
    title: "Competitive Price Anchoring",
    prompt: "I want to discover which competitors or alternatives customers compare us to when evaluating price—so we can clearly position our product's value and pricing strategy.",
    icon: Target
  },
  {
    title: "Pricing Objections & Friction",
    prompt: "I want to uncover where, when, and why customers hesitate or object to our pricing, giving us clear opportunities to remove barriers and better align perceived value.",
    icon: BarChart2
  },
  {
    title: "ROI & Perceived Impact",
    prompt: "I want to learn how customers evaluate the impact and ROI our product delivers, allowing us to clarify the connection between our pricing and the clear value we provide.",
    icon: Users
  }
]

const supportTemplates: Template[] = [
  {
    title: "Support Experience",
    prompt: "I want to gather feedback on our customer support experience",
    icon: UserPlus
  },
  {
    title: "Issue Resolution",
    prompt: "I need to understand how effectively we're resolving customer issues",
    icon: Users
  }
]

// Update the component props interface
interface CreateConversationFormProps {
  isNew?: boolean;
  chatId?: string;
  isRegenerating?: boolean;
}

export const CreateConversationForm = React.memo(function CreateConversationForm({ isNew = false, chatId: propChatId, isRegenerating = false }: CreateConversationFormProps) {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  // Use the prop chatId if provided, otherwise try to get it from params
  const chatId = propChatId || (params?.id as string)
  
  // Add refs for each card
  const cardRefs = {
    card1: useRef<HTMLDivElement>(null),
    card2: useRef<HTMLDivElement>(null),
    card3: useRef<HTMLDivElement>(null),
    card4: useRef<HTMLDivElement>(null),
    card5: useRef<HTMLDivElement>(null),
  }
  
  // Log the chat ID for debugging
  useEffect(() => {
    console.log('Chat ID:', isNew ? 'Creating new on submit' : chatId)
  }, [chatId, isNew])
  
  // State for form values
  const [topic, setTopic] = useState("")
  const [duration, setDuration] = useState("")
  const [respondentContacts, setRespondentContacts] = useState<boolean | null>(null)
  const [incentiveStatus, setIncentiveStatus] = useState<boolean | null>(null)
  const [incentiveCode, setIncentiveCode] = useState("")
  const [incentiveDescription, setIncentiveDescription] = useState("")
  const [additionalDetails, setAdditionalDetails] = useState("")
  
  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLoadingScreen, setShowLoadingScreen] = useState(false)
  
  // State for visible cards
  const [visibleCards, setVisibleCards] = useState(isRegenerating ? 5 : 1)
  
  // Add effect to load existing data when regenerating
  useEffect(() => {
    if (isRegenerating && chatId) {
      const fetchChatDetails = async () => {
        try {
          const response = await fetch(`/api/chat-instances/details?chatId=${chatId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch chat details');
          }
          
          const data = await response.json();
          
          // Map database duration format to form duration format
          let formattedDuration = data.duration || "";
          if (formattedDuration) {
            // Convert from backend format to frontend display format
            if (formattedDuration.includes("1 minute")) {
              formattedDuration = "1 minute (quick)";
            } else if (formattedDuration.includes("2 minutes")) {
              formattedDuration = "2 minutes (focused)";
            } else if (formattedDuration.includes("3-4 minutes")) {
              formattedDuration = "3-4 minutes (recommended)";
            } else if (formattedDuration.includes("5-6 minutes")) {
              formattedDuration = "5-6 minutes (balanced)";
            } else if (formattedDuration.includes("7-8 minutes")) {
              formattedDuration = "7-8 minutes (exploratory)";
            } else if (formattedDuration.includes("9-10 minutes")) {
              formattedDuration = "9-10 minutes (deep dive)";
            }
          }
          
          // Populate form fields with existing data
          setTopic(data.topic || "");
          setDuration(formattedDuration);
          setRespondentContacts(data.respondentContacts);
          setIncentiveStatus(data.incentiveStatus);
          setIncentiveCode(data.incentiveCode || "");
          
          // Remove the prefix from incentive description if it exists
          let incentiveDesc = data.incentiveDescription || "";
          const prefix = "Upon completion, you'll receive ";
          if (incentiveDesc.startsWith(prefix)) {
            incentiveDesc = incentiveDesc.substring(prefix.length);
          }
          setIncentiveDescription(incentiveDesc);
          
          setAdditionalDetails(data.additionalDetails || "");
          
          // Show all cards when regenerating
          setVisibleCards(5);
        } catch (error) {
          console.error('Error fetching chat details:', error);
          toast.error('Failed to load existing conversation details');
        }
      };
      
      fetchChatDetails();
    }
  }, [isRegenerating, chatId]);
  
  // Add effect to scroll to the newly visible card when visibleCards changes
  useEffect(() => {
    if (visibleCards > 1 && !isRegenerating) {
      const cardRef = cardRefs[`card${visibleCards}` as keyof typeof cardRefs]
      if (cardRef.current) {
        setTimeout(() => {
          cardRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          })
        }, 100)
      }
    }
  }, [visibleCards, isRegenerating])
  
  // Function to check if a card has content
  const hasContent = (cardIndex: number) => {
    switch (cardIndex) {
      case 1:
        return topic.trim().length > 0
      case 2:
        return duration.trim().length > 0
      case 3:
        return respondentContacts !== null
      case 4:
        return incentiveStatus !== null && (!incentiveStatus || (incentiveStatus && incentiveCode.trim().length > 0 && incentiveDescription.trim().length > 0))
      case 5:
        return additionalDetails.trim().length > 0 // Only true when content is actually added
      default:
        return false
    }
  }
  
  // Function to show the next card
  const showNextCard = () => {
    if (visibleCards < 5) {
      setVisibleCards(visibleCards + 1)
    }
  }
  
  // Template selection handler
  const handleTemplateSelect = (prompt: string) => {
    setTopic(prompt)
  }

  // Handle duration selection with auto-progression
  const handleDurationSelect = (time: string) => {
    setDuration(time)
    // Auto-progress to next card after selection
    if (visibleCards === 2) {
      setTimeout(() => {
        showNextCard()
      }, 300)
    }
  }

  // Add state for active category
  const [activeCategory, setActiveCategory] = useState("churn")

  // Category definitions with emoji icons and labels
  const categories = [
    { id: "churn", icon: "🔄", label: "Churn & Retention" },
    { id: "growth", icon: "📈", label: "Growth & Acquisition" },
    { id: "product", icon: "✨", label: "Product Experience & Perception" },
    { id: "problems", icon: "📌", label: "Customer Problems & Needs" },
    { id: "pricing", icon: "💸", label: "Pricing & Value Proposition" },
    { id: "positioning", icon: "📢", label: "Positioning & Differentiation" },
  ]

  // Define template type for TypeScript
  type TemplateType = {
    title: string;
    prompt: string;
    icon: React.ComponentType<{ className?: string }>;
  };

  // Content options for each category (using existing templates)
  const categoryTemplates: Record<string, TemplateType[]> = {
    churn: [
      {
        title: "Churn Reasons & Product Gaps",
        prompt: "I want clear insights into why customers stopped using our product—including where expectations weren't met, what frustrations they encountered, and what gaps caused them to leave—so we can quickly prioritize changes to reduce churn.",
        icon: Users
      },
      {
        title: "Early Warning Signs & Risk Factors",
        prompt: "I want to learn exactly what early signals or risk factors predict customer churn—allowing us to act proactively and improve retention.",
        icon: Target
      },
      {
        title: "Stickiness & Retention Drivers",
        prompt: "I want to discover precisely what keeps our most satisfied customers staying engaged long-term—helping us reinforce those value experiences clearly across all customers.",
        icon: BarChart2
      },
      {
        title: "Competitive Switching Insights",
        prompt: "I want clarity around if customers switch to competitors, understanding the exact reasons they'd leave us for an alternative solution—so we can address gaps and enhance competitive strengths.",
        icon: MessageSquare
      }
    ],
    growth: [
      {
        title: "Customer Acquisition Channels",
        prompt: "I want to clearly learn exactly how customers initially discover and hear about our product—so we can double down on the channels that drive real growth.",
        icon: UserPlus
      },
      {
        title: "Activation & Conversion Moments",
        prompt: "I want to clearly pinpoint the specific experiences and features that first convince new users our product is valuable—so we can improve onboarding and activation.",
        icon: BarChart2
      },
      {
        title: "Referral & Word-of-Mouth Drivers",
        prompt: "I want to understand exactly which product experiences or outcomes excite customers enough to recommend us to others, clearly identifying opportunities to boost organic growth.",
        icon: Users
      },
      {
        title: "Growth Barriers & Friction Points",
        prompt: "I want clear feedback on any current obstacles or barriers customers encounter that prevent them from fully adopting or recommending our product—so we can remove blocks to growth and improve their journey.",
        icon: Target
      },
      {
        title: "Activation & Conversion Opportunities",
        prompt: "I want to pinpoint the exact moments when customers clearly perceive value after signing up—so we know precisely what to emphasize to boost conversion rates and engagement.",
        icon: MessageSquare
      }
    ],
    product: productTemplates,
    problems: [
      {
        title: "Product Pain Points & Friction",
        prompt: "I want to clearly understand the frustrations, frictions, and ongoing pain points customers experience using our product—including how frequent and urgent these issues are—so we can quickly prioritize improvements.",
        icon: Target
      },
      {
        title: "Unmet Needs & Workarounds",
        prompt: "I want to uncover emerging needs, gaps, or problems our product isn't addressing fully—including alternative tools or workarounds customers currently use alongside us—so we can expand our product's value.",
        icon: MessageSquare
      },
      {
        title: "Customer Goals & Jobs-to-be-Done",
        prompt: "I want a clear understanding of the core tasks (\"jobs\") customers are trying to accomplish, and which outcomes (\"gains\") they most value—helping us better align our product's value proposition to their needs.",
        icon: Users
      },
      {
        title: "Root Cause Discovery",
        prompt: "I want to explore and identify the exact underlying causes behind customer pain points, going beyond surface-level issues—so we understand precisely why frustrations arise and prioritize meaningful solutions.",
        icon: BarChart2
      },
      {
        title: "Customer Persona Insights",
        prompt: "I want to develop a deeper understanding of our customer personas—including their motivations, challenges, goals, and behaviors—so we can better tailor our product and messaging to their specific needs.",
        icon: UserPlus
      }
    ],
    pricing: salesTemplates,
    positioning: marketingTemplates
  }

  // Handle respondent contacts selection with auto-progression
  const handleRespondentContactsSelect = (value: boolean) => {
    setRespondentContacts(value)
    // Auto-progress to next card after selection
    if (visibleCards === 3) {
      setTimeout(() => {
        showNextCard()
      }, 300)
    }
  }

  // Handle incentive selection with auto-progression for "No" option
  const handleIncentiveSelect = (value: boolean) => {
    setIncentiveStatus(value)
    // Auto-progress to next card only if "No" is selected
    if (!value && visibleCards === 4) {
      setTimeout(() => {
        showNextCard()
      }, 300)
    }
  }

  // Check if all required fields are filled
  const isFormComplete = () => {
    return hasContent(1) && hasContent(2) && hasContent(3) && hasContent(4);
  }

  // Duration options
  const durationOptions = [
    "1 minute (quick)",
    "2 minutes (focused)",
    "3-4 minutes (recommended)",
    "5-6 minutes (balanced)",
    "7-8 minutes (exploratory)",
    "9-10 minutes (deep dive)"
  ]

  // Add quota checking
  const { hasAvailablePlanQuota, isLoading: isQuotaLoading, planQuotaPercentage } = useQuotaAvailability();
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormComplete()) return
    
    try {
      setIsSubmitting(true)
      setShowLoadingScreen(true) // Show loading screen
      
      let targetChatId = chatId;
      
      // If this is a new conversation, create a chat instance first
      if (isNew) {
        const createResponse = await fetch('/api/chats/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!createResponse.ok) {
          throw new Error('Failed to create chat instance');
        }
        
        const { id } = await createResponse.json();
        targetChatId = id;
      }
      
      // Prepare incentive description with prefix if incentive is enabled
      const formattedIncentiveDescription = incentiveStatus 
        ? `Upon completion, you'll receive ${incentiveDescription}` 
        : incentiveDescription;
      
      // Now update the chat instance with form data
      const response = await fetch(`/api/chat-instances/update?chatId=${targetChatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          duration,
          respondentContacts,
          incentiveStatus,
          incentiveCode,
          incentiveDescription: formattedIncentiveDescription,
          additionalDetails,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save conversation details')
      }
      
      // Generate conversation plan
      const planResponse = await fetch(`/api/conversation-plan/generate?chatId=${targetChatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          duration,
          additionalDetails,
        }),
      })
      
      if (!planResponse.ok) {
        console.error('Failed to generate conversation plan, but continuing')
        // Don't throw error here, we'll still navigate
        toast.success('Conversation details saved successfully!')
      } else {
        toast.success(isRegenerating ? 'Conversation plan regenerated successfully!' : 'Conversation plan generated successfully!')
      }
      
      // After generating the plan successfully:
      const planData = await planResponse.json();
      console.log('Generated plan data:', planData?.title);

      // Store the plan data in localStorage with detailed logging
      try {
        localStorage.setItem(`plan_${targetChatId}`, JSON.stringify({
          data: planData,
          timestamp: Date.now()
        }));
        console.log('Plan data stored in localStorage');
      } catch (e) {
        console.error('Error storing plan data in localStorage:', e);
      }

      // Redirect with the useLocal flag
      router.push(`/conversations/${targetChatId}?tab=plan&useLocal=true${isRegenerating ? '&from=regenerate' : ''}`);
    } catch (error) {
      console.error('Error saving conversation details:', error)
      toast.error('Failed to save conversation details. Please try again.')
      setShowLoadingScreen(false) // Hide loading screen on error
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update the button text based on whether we're regenerating and quota status
  const getSubmitButtonText = () => {
    if (isSubmitting) {
      return isRegenerating ? "Regenerating Plan..." : "Generating Plan...";
    }
    
    if (!isQuotaLoading && !hasAvailablePlanQuota) {
      return "⚠️ You're out of generation credits!";
    }
    
    return isRegenerating ? "Regenerate Plan" : "Generate Plan";
  };

  return (
    <div className="space-y-12 w-full pb-20">
      {showLoadingScreen && <LoadingScreen />}
      
      {/* Card 1: Topic */}
      <div ref={cardRefs.card1}>
        <div className="border rounded-lg p-8 bg-[#FAFAFA] w-full">
          <h3 className="text-base font-medium mb-2 flex items-center">
            Describe Your Conversation Goal
            <StatusDot active={hasContent(1)} />
          </h3>
          <p className="text-sm text-gray-500 mb-6">Help us understand your goal—what do you want to learn from your customers?</p>
          
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., I want to learn why customers decide to cancel—so we can reduce churn."
            className="mb-8 min-h-[120px] bg-white"
          />
          
          <div className="space-y-6">
            <label className="text-sm font-medium">Select a Conversation Category (optional):</label>
            <div className="flex flex-wrap gap-3 pb-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "px-4 py-2 text-sm rounded-full transition-all shadow-sm",
                    activeCategory === category.id
                      ? "bg-black text-white shadow-sm"
                      : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200",
                  )}
                >
                  <span className="mr-2">{category.icon}</span>
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
            
            <div className="pt-6 border-t mt-6">
              <div className="mb-6">
                <h3 className="text-sm font-medium">
                  Select a topic template for:{" "}
                  <span className="text-black font-semibold">{categories.find((c) => c.id === activeCategory)?.label}</span>
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 max-w-3xl">
                {categoryTemplates[activeCategory as keyof typeof categoryTemplates].map((template) => (
                  <button
                    key={template.title}
                    onClick={() => handleTemplateSelect(template.prompt)}
                    className={cn(
                      "p-3.5 rounded-lg border border-gray-200 bg-white",
                      topic === template.prompt 
                        ? "border-gray-400 shadow-md" 
                        : "hover:shadow-sm hover:border-gray-300",
                      "transition-all duration-200",
                      "text-left flex items-center gap-3",
                      "focus:outline-none focus:ring-1 focus:ring-gray-200",
                      "shadow-sm",
                      "group"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                      topic === template.prompt
                        ? "bg-gray-200 text-gray-700"
                        : "bg-gray-100 text-gray-500"
                    )}>
                      <template.icon className="h-3.5 w-3.5" />
                    </div>
                    <h3 className={cn(
                      "text-sm",
                      topic === template.prompt ? "font-medium" : "text-gray-700"
                    )}>
                      {template.title}
                    </h3>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {visibleCards === 1 && (
          <div className="flex justify-end mt-5">
            <Button 
              onClick={showNextCard} 
              className="bg-black text-white hover:bg-gray-800 h-9 text-xs px-5"
            >
              Next <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Card 2: Duration */}
      {visibleCards >= 2 && (
        <div ref={cardRefs.card2}>
          <div className="border rounded-lg p-8 bg-[#FAFAFA] w-full">
            <h3 className="text-base font-medium mb-2 flex items-center">
              Set the Conversation Duration
              <StatusDot active={hasContent(2)} />
            </h3>
            <p className="text-sm text-gray-500 mb-6">Approximately how long should the agent engage respondents in conversation before wrapping up?</p>
            
            <div className="grid grid-cols-2 gap-4 mb-4 max-w-3xl">
              {durationOptions.map((time) => (
                <button
                  key={time}
                  onClick={() => handleDurationSelect(time)}
                  className={cn(
                    "p-4 rounded-lg border",
                    duration === time 
                      ? "border-black bg-gray-50" 
                      : "border-gray-200 bg-white hover:bg-gray-50",
                    "transition-colors duration-200 text-center"
                  )}
                >
                  <span className="text-sm">{time}</span>
                </button>
              ))}
            </div>
          </div>
          
          {visibleCards === 2 && (
            <div className="flex justify-end mt-5">
              <Button 
                onClick={showNextCard} 
                className="bg-black text-white hover:bg-gray-800 h-9 text-xs px-5"
              >
                Next <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Card 3: Respondent Contacts */}
      {visibleCards >= 3 && (
        <div ref={cardRefs.card3}>
          <div className="border rounded-lg p-8 bg-[#FAFAFA] w-full">
            <h3 className="text-base font-medium mb-2 flex items-center">
              Collect Respondent Details
              <StatusDot active={hasContent(3)} />
            </h3>
            <p className="text-sm text-gray-500 mb-6">Do you want to capture first name and email? We'll ask them at the outset of the chat.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-4 max-w-3xl">
              <button
                onClick={() => handleRespondentContactsSelect(true)}
                className={cn(
                  "p-4 rounded-lg border",
                  respondentContacts === true 
                    ? "border-black bg-gray-50" 
                    : "border-gray-200 bg-white hover:bg-gray-50",
                  "transition-colors duration-200 text-center"
                )}
              >
                <span className="text-sm">Yes, capture name and email</span>
              </button>
              <button
                onClick={() => handleRespondentContactsSelect(false)}
                className={cn(
                  "p-4 rounded-lg border",
                  respondentContacts === false 
                    ? "border-black bg-gray-50" 
                    : "border-gray-200 bg-white hover:bg-gray-50",
                  "transition-colors duration-200 text-center"
                )}
              >
                <span className="text-sm">No, keep it anonymous</span>
              </button>
            </div>
          </div>
          
          {visibleCards === 3 && (
            <div className="flex justify-end mt-5">
              <Button 
                onClick={showNextCard} 
                className="bg-black text-white hover:bg-gray-800 h-9 text-xs px-5"
              >
                Next <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Card 4: Incentive */}
      {visibleCards >= 4 && (
        <div ref={cardRefs.card4}>
          <div className="border rounded-lg p-8 bg-[#FAFAFA] w-full">
            <h3 className="text-base font-medium mb-2 flex items-center">
              Add an Incentive (optional)
              <StatusDot active={hasContent(4)} />
            </h3>
            <p className="text-sm text-gray-500 mb-6">Encourage participation with a reward.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6 max-w-3xl">
              <button
                onClick={() => handleIncentiveSelect(true)}
                className={cn(
                  "p-4 rounded-lg border",
                  incentiveStatus === true 
                    ? "border-black bg-gray-50" 
                    : "border-gray-200 bg-white hover:bg-gray-50",
                  "transition-colors duration-200 text-center"
                )}
              >
                <span className="text-sm">Yes, add incentive</span>
              </button>
              <button
                onClick={() => handleIncentiveSelect(false)}
                className={cn(
                  "p-4 rounded-lg border",
                  incentiveStatus === false 
                    ? "border-black bg-gray-50" 
                    : "border-gray-200 bg-white hover:bg-gray-50",
                  "transition-colors duration-200 text-center"
                )}
              >
                <span className="text-sm">No incentive needed</span>
              </button>
            </div>
            
            {incentiveStatus && (
              <div className="space-y-8 mt-6 max-w-3xl p-6 bg-gray-50 rounded-md border border-gray-100">
                <div>
                  <label htmlFor="incentive-code" className="block text-sm font-medium mb-2">
                    Incentive Code
                  </label>
                  <Input
                    id="incentive-code"
                    value={incentiveCode}
                    onChange={(e) => setIncentiveCode(e.target.value)}
                    placeholder="Enter a discount code to share after the chat (e.g., 'SAVE10')"
                    className="bg-white max-w-xs"
                  />
                </div>
                
                <div className="pt-2">
                  <label htmlFor="incentive-description" className="block text-sm font-medium mb-2">
                    Incentive Details
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Complete the sentence to describe your reward. It will appear to users prefixed with 'Upon completion, you'll receive'.
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-sm whitespace-nowrap italic text-gray-600">Upon completion, you'll receive</span>
                    <Input
                      id="incentive-description"
                      value={incentiveDescription}
                      onChange={(e) => setIncentiveDescription(e.target.value)}
                      placeholder="20% off your next order, a free sample, etc."
                      className="bg-white flex-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {visibleCards === 4 && (
            <div className="flex justify-end mt-5">
              <Button 
                onClick={showNextCard} 
                className="bg-black text-white hover:bg-gray-800 h-9 text-xs px-5"
              >
                Next <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Card 5: Additional Details */}
      {visibleCards >= 5 && (
        <div ref={cardRefs.card5}>
          <div className="border rounded-lg p-8 bg-[#FAFAFA] w-full">
            <h3 className="text-base font-medium mb-2 flex items-center">
              Optional: Additional Context or Guidance
              <StatusDot active={hasContent(5)} />
            </h3>
            <p className="text-sm text-gray-500 mb-6">Provide any context or clarifying guidance you'd like the AI to keep in mind when crafting your conversation plan.</p>
            
            <Textarea
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="I.e. specifically ask about their favourite feature and explore the reasons why."
              className="mb-6 min-h-[120px] max-w-3xl bg-white"
            />
          </div>
          
          <div className="flex justify-end mt-8 space-x-4">
            {isRegenerating && (
              <Button 
                onClick={() => router.push(`/conversations/${chatId}?tab=plan`)}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
              >
                Back to Plan
              </Button>
            )}
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || (!isQuotaLoading && !hasAvailablePlanQuota) || !isFormComplete()}
              className={cn(
                "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm px-5 py-2 transition-all duration-200",
                !isFormComplete() && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {getSubmitButtonText()}
                </>
              ) : (
                getSubmitButtonText()
              )}
            </Button>
          </div>
          {/* Add quota exceeded message */}
          {!isQuotaLoading && !hasAvailablePlanQuota && (
            <div className="mt-3 text-red-500 text-sm flex items-center justify-end">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span>You've reached your conversation plan generation limit.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}); 