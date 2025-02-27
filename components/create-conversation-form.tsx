"use client"

import { useState, useEffect } from "react"
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
  ChevronRight
} from "lucide-react"

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

export function CreateConversationForm() {
  // State for form values
  const [topic, setTopic] = useState("")
  const [duration, setDuration] = useState("")
  const [respondentContacts, setRespondentContacts] = useState<boolean | null>(null)
  const [incentiveStatus, setIncentiveStatus] = useState<boolean | null>(null)
  const [incentiveCode, setIncentiveCode] = useState("")
  const [incentiveDescription, setIncentiveDescription] = useState("")
  const [additionalDetails, setAdditionalDetails] = useState("")
  
  // State for visible cards
  const [visibleCards, setVisibleCards] = useState(1)
  
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
      // Improved scroll to bottom after state update
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        })
      }, 300)
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
    "2 minutes (chit-chat)",
    "3-5 minutes (recommended)",
    "6-7 minutes (exploratory)",
    "8-10 minutes (deep dive)"
  ]

  return (
    <div className="space-y-8 w-full pb-16">
      {/* Card 1: Topic */}
      <div>
        <div className="border rounded-lg p-6 bg-[#FAFAFA] w-full">
          <h3 className="text-base font-medium mb-1 flex items-center">
            Describe Your Conversation Topic
            <StatusDot active={hasContent(1)} />
          </h3>
          <p className="text-sm text-gray-500 mb-4">Help us understand your goal—what do you want to learn from your customers?</p>
          
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., I want to understand why customers are canceling their subscriptions"
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
        <div>
          <div className="border rounded-lg p-6 bg-[#FAFAFA] w-full">
            <h3 className="text-base font-medium mb-1 flex items-center">
              Set the Conversation Duration
              <StatusDot active={hasContent(2)} />
            </h3>
            <p className="text-sm text-gray-500 mb-4">Approximately how long should this chat conversation last?</p>
            
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
        <div>
          <div className="border rounded-lg p-6 bg-[#FAFAFA] w-full">
            <h3 className="text-base font-medium mb-1 flex items-center">
              Collect Respondent Details
              <StatusDot active={hasContent(3)} />
            </h3>
            <p className="text-sm text-gray-500 mb-4">Want to capture names and emails? We'll ask them at the outset of the chat.</p>
            
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
        <div>
          <div className="border rounded-lg p-6 bg-[#FAFAFA] w-full">
            <h3 className="text-base font-medium mb-1 flex items-center">
              Add an Incentive
              <StatusDot active={hasContent(4)} />
            </h3>
            <p className="text-sm text-gray-500 mb-4">Encourage participation with a reward</p>
            
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
        <div>
          <div className="border rounded-lg p-6 bg-[#FAFAFA] w-full">
            <h3 className="text-base font-medium mb-1 flex items-center">
              Optional: Any additional details or instructions?
              <StatusDot active={hasContent(5)} />
            </h3>
            <p className="text-sm text-gray-500 mb-4">Add any specific questions or context that will help shape the conversation</p>
            
            <Textarea
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="Add any additional context or specific questions you'd like to include"
              className="mb-4 min-h-[100px] max-w-xl bg-white"
            />
          </div>
          
          <div className="flex justify-end mt-6">
            <Button 
              className={cn(
                isFormComplete() 
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" 
                  : "bg-gray-300 hover:bg-gray-400",
                "text-white transition-all duration-200"
              )}
              disabled={!isFormComplete()}
            >
              Generate Plan
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 