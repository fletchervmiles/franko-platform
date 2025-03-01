"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Loader2
} from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import LoadingScreen from "./loading-screen"

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
    title: "Product Feedback",
    prompt: "I want to gather feedback on our product's usability and features",
    icon: Target
  },
  {
    title: "Feature Prioritization",
    prompt: "I need to understand which features our customers value most",
    icon: BarChart2
  }
]

const marketingTemplates: Template[] = [
  {
    title: "Brand Perception",
    prompt: "I want to understand how customers perceive our brand",
    icon: Target
  },
  {
    title: "Campaign Effectiveness",
    prompt: "I need feedback on our recent marketing campaign",
    icon: BarChart2
  }
]

const salesTemplates: Template[] = [
  {
    title: "Sales Process Feedback",
    prompt: "I want to improve our sales process based on customer feedback",
    icon: MessageSquare
  },
  {
    title: "Pricing Strategy",
    prompt: "I need to understand how customers perceive our pricing",
    icon: DollarSign
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

export function CreateConversationForm({ isNew = false, chatId: propChatId, isRegenerating = false }: CreateConversationFormProps) {
  const router = useRouter()
  const params = useParams()
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
          setIncentiveDescription(data.incentiveDescription || "");
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
          incentiveDescription,
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
      
      // Navigate to the conversations route with the plan tab active
      router.push(`/conversations/${targetChatId}?tab=plan${isRegenerating ? '&from=regenerate' : ''}`)
    } catch (error) {
      console.error('Error saving conversation details:', error)
      toast.error('Failed to save conversation details. Please try again.')
      setShowLoadingScreen(false) // Hide loading screen on error
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update the button text based on whether we're regenerating
  const submitButtonText = isSubmitting 
    ? (isRegenerating ? "Regenerating Plan..." : "Generating Plan...")
    : (isRegenerating ? "Regenerate Plan" : "Generate Plan");

  return (
    <div className="space-y-8 w-full pb-16">
      {showLoadingScreen && <LoadingScreen />}
      
      {/* Card 1: Topic */}
      <div ref={cardRefs.card1}>
        <div className="border rounded-lg p-6 bg-[#FAFAFA] w-full">
          <h3 className="text-base font-medium mb-1 flex items-center">
            Describe Your Conversation Topic
            <StatusDot active={hasContent(1)} />
          </h3>
          <p className="text-sm text-gray-500 mb-4">Help us understand your goal—what do you want to learn from your customers?</p>
          
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., I to understand why customers cancel their subscriptions"
            className="mb-4 min-h-[100px] bg-white"
          />
          
          <Tabs defaultValue="product" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none bg-[#FAFAFA] p-0 mb-4">
              <TabsTrigger
                value="product"
                className="group relative rounded-none border-b-2 border-transparent px-4 pb-0 data-[state=active]:border-black data-[state=active]:shadow-none data-[state=active]:text-black transition-colors"
              >
                <span className="relative z-10 p-2 rounded-lg group-hover:text-black">Product</span>
              </TabsTrigger>
              <TabsTrigger
                value="marketing"
                className="group relative rounded-none border-b-2 border-transparent px-4 pb-0 data-[state=active]:border-black data-[state=active]:shadow-none data-[state=active]:text-black transition-colors"
              >
                <span className="relative z-10 p-2 rounded-lg group-hover:text-black">Marketing</span>
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="group relative rounded-none border-b-2 border-transparent px-4 pb-0 data-[state=active]:border-black data-[state=active]:shadow-none data-[state=active]:text-black transition-colors"
              >
                <span className="relative z-10 p-2 rounded-lg group-hover:text-black">Sales</span>
              </TabsTrigger>
              <TabsTrigger
                value="support"
                className="group relative rounded-none border-b-2 border-transparent px-4 pb-0 data-[state=active]:border-black data-[state=active]:shadow-none data-[state=active]:text-black transition-colors"
              >
                <span className="relative z-10 p-2 rounded-lg group-hover:text-black">Support</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="product" className="mt-0">
              <div className="grid grid-cols-2 gap-3 max-w-2xl">
                {productTemplates.map((template) => (
                  <button
                    key={template.title}
                    onClick={() => handleTemplateSelect(template.prompt)}
                    className={cn(
                      "p-4 rounded-lg border border-gray-200 bg-white",
                      "hover:bg-gray-50 transition-colors duration-200",
                      "text-left flex items-center gap-3",
                      "focus:outline-none focus:ring-1 focus:ring-gray-200",
                      "shadow-[0_0_1px_rgba(0,0,0,0.05)]",
                      "group"
                    )}
                  >
                    <template.icon className="h-4 w-4 text-[#0070f3]/70 flex-shrink-0 transition-colors group-hover:text-[#0070f3]" />
                    <h3 className="text-sm text-gray-700">{template.title}</h3>
                  </button>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="marketing" className="mt-0">
              <div className="grid grid-cols-2 gap-3 max-w-2xl">
                {marketingTemplates.map((template) => (
                  <button
                    key={template.title}
                    onClick={() => handleTemplateSelect(template.prompt)}
                    className={cn(
                      "p-4 rounded-lg border border-gray-200 bg-white",
                      "hover:bg-gray-50 transition-colors duration-200",
                      "text-left flex items-center gap-3",
                      "focus:outline-none focus:ring-1 focus:ring-gray-200",
                      "shadow-[0_0_1px_rgba(0,0,0,0.05)]",
                      "group"
                    )}
                  >
                    <template.icon className="h-4 w-4 text-[#0070f3]/70 flex-shrink-0 transition-colors group-hover:text-[#0070f3]" />
                    <h3 className="text-sm text-gray-700">{template.title}</h3>
                  </button>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="sales" className="mt-0">
              <div className="grid grid-cols-2 gap-3 max-w-2xl">
                {salesTemplates.map((template) => (
                  <button
                    key={template.title}
                    onClick={() => handleTemplateSelect(template.prompt)}
                    className={cn(
                      "p-4 rounded-lg border border-gray-200 bg-white",
                      "hover:bg-gray-50 transition-colors duration-200",
                      "text-left flex items-center gap-3",
                      "focus:outline-none focus:ring-1 focus:ring-gray-200",
                      "shadow-[0_0_1px_rgba(0,0,0,0.05)]",
                      "group"
                    )}
                  >
                    <template.icon className="h-4 w-4 text-[#0070f3]/70 flex-shrink-0 transition-colors group-hover:text-[#0070f3]" />
                    <h3 className="text-sm text-gray-700">{template.title}</h3>
                  </button>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="support" className="mt-0">
              <div className="grid grid-cols-2 gap-3 max-w-2xl">
                {supportTemplates.map((template) => (
                  <button
                    key={template.title}
                    onClick={() => handleTemplateSelect(template.prompt)}
                    className={cn(
                      "p-4 rounded-lg border border-gray-200 bg-white",
                      "hover:bg-gray-50 transition-colors duration-200",
                      "text-left flex items-center gap-3",
                      "focus:outline-none focus:ring-1 focus:ring-gray-200",
                      "shadow-[0_0_1px_rgba(0,0,0,0.05)]",
                      "group"
                    )}
                  >
                    <template.icon className="h-4 w-4 text-[#0070f3]/70 flex-shrink-0 transition-colors group-hover:text-[#0070f3]" />
                    <h3 className="text-sm text-gray-700">{template.title}</h3>
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {visibleCards === 1 && (
          <div className="flex justify-end mt-3">
            <Button 
              onClick={showNextCard} 
              className="bg-black text-white hover:bg-gray-800 h-8 text-xs px-4"
            >
              Next <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Card 2: Duration */}
      {visibleCards >= 2 && (
        <div ref={cardRefs.card2}>
          <div className="border rounded-lg p-6 bg-[#FAFAFA] w-full">
            <h3 className="text-base font-medium mb-1 flex items-center">
              Set the Conversation Duration
              <StatusDot active={hasContent(2)} />
            </h3>
            <p className="text-sm text-gray-500 mb-4">Approximately how long should the agent engage respondents in conversation before wrapping up?</p>
            
            <div className="grid grid-cols-2 gap-3 mb-4 max-w-2xl">
              {durationOptions.map((time) => (
                <button
                  key={time}
                  onClick={() => handleDurationSelect(time)}
                  className={cn(
                    "p-3 rounded-lg border",
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
            <div className="flex justify-end mt-3">
              <Button 
                onClick={showNextCard} 
                className="bg-black text-white hover:bg-gray-800 h-8 text-xs px-4"
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
          <div className="border rounded-lg p-6 bg-[#FAFAFA] w-full">
            <h3 className="text-base font-medium mb-1 flex items-center">
              Collect Respondent Details
              <StatusDot active={hasContent(3)} />
            </h3>
            <p className="text-sm text-gray-500 mb-4">Do you want to capture names and emails? We'll ask them at the outset of the chat.</p>
            
            <div className="grid grid-cols-2 gap-3 mb-4 max-w-2xl">
              <button
                onClick={() => handleRespondentContactsSelect(true)}
                className={cn(
                  "p-3 rounded-lg border",
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
                  "p-3 rounded-lg border",
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
            <div className="flex justify-end mt-3">
              <Button 
                onClick={showNextCard} 
                className="bg-black text-white hover:bg-gray-800 h-8 text-xs px-4"
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
          <div className="border rounded-lg p-6 bg-[#FAFAFA] w-full">
            <h3 className="text-base font-medium mb-1 flex items-center">
              Add an Incentive
              <StatusDot active={hasContent(4)} />
            </h3>
            <p className="text-sm text-gray-500 mb-4">Encourage participation with a reward.</p>
            
            <div className="grid grid-cols-2 gap-3 mb-4 max-w-2xl">
              <button
                onClick={() => handleIncentiveSelect(true)}
                className={cn(
                  "p-3 rounded-lg border",
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
                  "p-3 rounded-lg border",
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
              <div className="space-y-4 mt-4 max-w-xl">
                <div>
                  <label htmlFor="incentive-code" className="block text-sm font-medium mb-1">
                    Discount Code (optional)
                  </label>
                  <Input
                    id="incentive-code"
                    value={incentiveCode}
                    onChange={(e) => setIncentiveCode(e.target.value)}
                    placeholder="Enter a discount code to share after the chat (e.g., 'SAVE10')"
                    className="bg-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="incentive-description" className="block text-sm font-medium mb-1">
                    Description (optional)
                  </label>
                  <Textarea
                    id="incentive-description"
                    value={incentiveDescription}
                    onChange={(e) => setIncentiveDescription(e.target.value)}
                    placeholder="Add a brief message to show at the start (e.g., 'Finish this chat and get 10% off your next purchase!')"
                    className="bg-white"
                  />
                </div>
              </div>
            )}
          </div>
          
          {visibleCards === 4 && (
            <div className="flex justify-end mt-3">
              <Button 
                onClick={showNextCard} 
                className="bg-black text-white hover:bg-gray-800 h-8 text-xs px-4"
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
          <div className="border rounded-lg p-6 bg-[#FAFAFA] w-full">
            <h3 className="text-base font-medium mb-1 flex items-center">
              Optional: Additional Context or Guidance
              <StatusDot active={hasContent(5)} />
            </h3>
            <p className="text-sm text-gray-500 mb-4">Provide any context or clarifying guidance you'd like the AI to keep in mind when crafting your conversation plan.</p>
            
            <Textarea
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="I.e. specifically ask about their favourite feature and explore the reasons why."
              className="mb-4 min-h-[100px] max-w-xl bg-white"
            />
          </div>
          
          <div className="flex justify-end mt-6 space-x-3">
            {isRegenerating && (
              <Button 
                onClick={() => router.push(`/conversations/${chatId}?tab=plan`)}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
              >
                Back to Plan
              </Button>
            )}
            <Button 
              onClick={handleSubmit}
              className={cn(
                isFormComplete() 
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" 
                  : "bg-gray-300 hover:bg-gray-400",
                "text-white transition-all duration-200"
              )}
              disabled={!isFormComplete() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {submitButtonText}
                </>
              ) : (
                submitButtonText
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 