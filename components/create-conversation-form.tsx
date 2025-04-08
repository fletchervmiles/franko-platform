"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import ReactMarkdown from 'react-markdown'
import { 
  Users, 
  Target, 
  BarChart2, 
  UserPlus, 
  MessageSquare, 
  DollarSign,
  ChevronRight,
  Loader2,
  AlertTriangle,
  PenLine,
  Sunrise,
  Clock,
  Lightbulb,
  LogOut
} from "lucide-react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import LoadingScreen from "./loading-screen"
import { useQuotaAvailability } from "@/hooks/use-quota-availability"
import TextareaAutosize from 'react-textarea-autosize'
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"

// Custom hook to fetch organisation name
const useOrganisationName = () => {
  const [organisationName, setOrganisationName] = useState<string>("product")
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function fetchOrganisationName() {
      try {
        const response = await fetch("/api/user/profile")
        const data = await response.json()
        setOrganisationName(data.organisationName || "product")
      } catch (error) {
        console.error("Error fetching organisation name:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchOrganisationName()
  }, [])
  
  return { organisationName, isLoading }
}

// Status indicator component
const StatusDot = ({ active }: { active: boolean }) => (
  <span 
    className={cn(
      "inline-block w-2 h-2 rounded-full ml-2",
      active ? "bg-green-500" : "bg-yellow-500"
    )} 
  />
)

// Update the component props interface
interface CreateConversationFormProps {
  isNew?: boolean;
  idProp?: string;
  isRegenerating?: boolean;
}

export const CreateConversationForm = React.memo(function CreateConversationForm({ isNew = false, idProp, isRegenerating = false }: CreateConversationFormProps) {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  // Use the prop ID if provided, otherwise try to get it from params
  const idVariable = idProp || (params ? (params as { id?: string }).id : undefined);
  
  // Fetch organisation name
  const { organisationName } = useOrganisationName()
  
  // Restore original card refs - remove card5
  const cardRefs = {
    card1: useRef<HTMLDivElement>(null),
    card2: useRef<HTMLDivElement>(null),
    card3: useRef<HTMLDivElement>(null),
    card4: useRef<HTMLDivElement>(null),
  }
  
  // Restore original state for visible cards 
  const [visibleCards, setVisibleCards] = useState(isRegenerating ? 4 : 1)
  
  // Log the chat ID for debugging
  useEffect(() => {
    console.log('Instance ID:', isNew ? 'Creating new on submit' : idVariable)
  }, [idVariable, isNew])
  
  // Restore original state for form values
  const [topic, setTopic] = useState<string>("")
  const [numTurns, setNumTurns] = useState<number>(10)
  const [respondentContacts, setRespondentContacts] = useState<boolean | null>(null)
  const [incentiveStatus, setIncentiveStatus] = useState<boolean | null>(null)
  const [incentiveCode, setIncentiveCode] = useState<string>("")
  const [incentiveDescription, setIncentiveDescription] = useState<string>("")
  const [additionalDetails, setAdditionalDetails] = useState<string>("")
  
  // Add state to track if the topic section has been interacted with
  const [hasInitiatedTopic, setHasInitiatedTopic] = useState<boolean>(false)
  
  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLoadingScreen, setShowLoadingScreen] = useState(false)
  
  // Conversation templates with icons
  const conversationTemplates = useMemo(() => [
    {
      title: "Acquisition & First Impressions",
      prompt: `I want to understand:

- how customers first discovered ${organisationName};
- the circumstances, motivations, or challenges that led them to search for a solution like ${organisationName};
- what specifically convinced them to try us; and
- their impressions so far.

I'll send this to new leads who've recently signed up to ${organisationName}.`,
      icon: Sunrise
    },
    {
      title: "Time to Value",
      prompt: `I want to understand:

- the key benefit or value customers originally hoped to achieve when they signed up for ${organisationName};
- how long it took them to experience their first "aha" moment or meaningful value;
- the specific feature or experience that delivered this initial value;
- whether their initial expectations have been met (and if not, what's missing);
- what they've found most valuable or enjoyable so far; and
- any early areas of friction, confusion, or opportunities we have to improve their experience.

I'll send this to customers who've recently completed onboarding and experienced their first interactions with ${organisationName}.`,
      icon: Clock
    },
    {
      title: "Product-Market Fit Engine",
      prompt: `I want to understand:

- the customer's role, key responsibilities, and context in which they're using ${organisationName};
- how customers would feel if they could no longer use ${organisationName} (very disappointed, somewhat disappointed, not disappointed) - and explore why!;
- the types of people or roles they believe get the most benefit from ${organisationName};
- the most important benefit or value they've personally experienced using ${organisationName}; and
- specific ways we could improve ${organisationName} and provide more value.

I'll send this to customers who actively use ${organisationName}, to assess overall product-market fit and inform our product roadmap.`,
      icon: Lightbulb
    },
    {
      title: "Churn & Exit Insights",
      prompt: `I want to understand:

- the primary reasons customers decided to stop using ${organisationName};
- any key gaps between their initial expectations and the actual value they experienced;
- specific frustrations, issues, or limitations that contributed directly to their decision to leave; and
- any immediate or obvious improvements they would suggest to better meet their expectations in future.

I'll send this to customers who've recently churned or canceled their ${organisationName} account.`,
      icon: LogOut
    }
  ], [organisationName]);
  
  // Update fetchChatDetails to use idVariable
  const fetchChatDetails = async () => {
    if (!idVariable) return; // Check idVariable
    try {
      // Use idVariable in the fetch URL
      const response = await fetch(`/api/chat-instances/${idVariable}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat details');
      }
      
      const chatData = await response.json();
      
      if (chatData.topic) setTopic(chatData.topic);
      // Parse duration string to set numTurns
      if (chatData.duration) {
        const turnsMatch = chatData.duration.match(/(\d+)\s+turns$/);
        if (turnsMatch && turnsMatch[1]) {
          const parsedTurns = parseInt(turnsMatch[1], 10);
          if (parsedTurns >= 3 && parsedTurns <= 20) {
            setNumTurns(parsedTurns);
          } else {
            setNumTurns(10); // Default if parsing fails or out of range
          }
        } else {
           setNumTurns(10); // Default if no turns found in string
        }
      }
      if (chatData.respondentContacts !== undefined) setRespondentContacts(chatData.respondentContacts);
      if (chatData.incentive_status !== undefined) setIncentiveStatus(chatData.incentive_status);
      if (chatData.incentive_code) setIncentiveCode(chatData.incentive_code);
      if (chatData.incentive_description) {
        const description = chatData.incentive_description.startsWith('Upon completion, you\'ll receive ')
          ? chatData.incentive_description.substring('Upon completion, you\'ll receive '.length)
          : chatData.incentive_description;
        setIncentiveDescription(description);
      }
      if (chatData.additionalDetails) setAdditionalDetails(chatData.additionalDetails);
      
      // Show all cards when regenerating
      setVisibleCards(4);
      // Mark topic as initiated if topic data is loaded
      if (chatData.topic) {
        setHasInitiatedTopic(true)
      }
    } catch (error) {
      console.error('Error fetching chat details:', error);
      toast.error('Failed to load conversation details');
    }
  };
  
  // Add effect to load existing data when regenerating
  useEffect(() => {
    // Check idVariable
    if (isRegenerating && idVariable) {
      fetchChatDetails();
    }
  }, [isRegenerating, idVariable]); // Depend on idVariable
  
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
        return (topic !== undefined && topic.trim().length > 0) || hasInitiatedTopic;
      case 2:
        // Check if numTurns is within the valid range (it should be by default)
        return numTurns >= 3 && numTurns <= 20;
      case 3:
        return respondentContacts === true || respondentContacts === false
      case 4:
        return incentiveStatus === false || (incentiveStatus === true && incentiveCode.trim().length > 0 && incentiveDescription.trim().length > 0)
      default:
        return false
    }
  }
  
  // Restore original showNextCard function
  const showNextCard = () => {
    if (visibleCards < 4) {
      setVisibleCards(visibleCards + 1)
    }
  }
  
  // Handle template selection
  const handleTemplateSelect = (prompt: string) => {
    setTopic(prompt)
    setHasInitiatedTopic(true)
  }

  // Handle "Start from Scratch"
  const handleStartFromScratch = () => {
    const scratchPrompt = ""
    setTopic(scratchPrompt)
    setHasInitiatedTopic(true)
  }

  // Update slider change handler (removed auto-progression logic)
  const handleTurnsChange = (value: number[]) => {
    const newTurns = value[0]
    if (newTurns >= 3 && newTurns <= 20) {
      setNumTurns(newTurns)
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
        // If there were a card 5, this would show it: showNextCard()
      }, 300)
    }
  }

  // Check if all required fields are filled
  const isFormComplete = () => {
    return hasContent(1) && hasContent(2) && hasContent(3) && hasContent(4);
  }

  // Add quota checking
  const { hasAvailablePlanQuota, isLoading: isQuotaLoading, planQuotaPercentage } = useQuotaAvailability();
  
  // Replace the loading message state with a progress state
  const [loadingProgress, setLoadingProgress] = useState("");
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormComplete()) return
    
    try {
      setIsSubmitting(true)
      setShowLoadingScreen(true) // Show loading screen
      
      let targetId = idVariable; // Use idVariable, rename for clarity
      
      // If this is a new conversation, create a chat instance first
      if (isNew) {
        setLoadingProgress("Creating conversation..."); // Update progress
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
        targetId = id; // Assign the new ID
      }
      
      // Prepare incentive description
      const formattedIncentiveDescription = incentiveStatus
          ? `Upon completion, you'll receive ${incentiveDescription}`
          : incentiveDescription;

      // Format the duration string based on numTurns
      const durationString = formatDurationString(numTurns);
      
      setLoadingProgress("Saving details..."); // Update progress
      // --- Correct the fetch call ---
      // Use PATCH method and the standard [id] route
      const response = await fetch(`/api/chat-instances/${targetId}`, {
        method: 'PATCH', // Use PATCH
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          duration: durationString,
          respondentContacts,
          incentiveStatus,
          incentiveCode,
          incentiveDescription: formattedIncentiveDescription,
          additionalDetails,
          // NOTE: published status is not set here, defaults to false
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save conversation details')
      }

      setLoadingProgress("Generating plan..."); // Update progress
      // Update the plan generation and handling section
      // Generate conversation plan - uses chatId query param, which is correct
      const planResponse = await fetch(`/api/conversation-plan/generate?chatId=${targetId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          duration: durationString,
          additionalDetails,
        }),
      });
      
      if (!planResponse.ok) {
        console.error('Failed to generate conversation plan, but continuing');
        // Don't throw error here, we'll still navigate
        toast.success('Conversation details saved successfully!');
        
        // Redirect with delay
        setTimeout(() => {
          router.push(`/conversations/${targetId}?tab=plan&useLocal=true${isRegenerating ? '&from=regenerate' : '&from=generate'}`);
        }, 2000);
      } else {
        // Wait for the full response body
        const planData = await planResponse.json();
        
        // Store the plan data in localStorage as fallback
        try {
          localStorage.setItem(`plan_${targetId}`, JSON.stringify({
            data: planData,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error('Error storing plan data in localStorage:', e);
        }
        
        // Show success message
        toast.success(isRegenerating ? 'Conversation plan regenerated successfully!' : 'Conversation plan generated successfully!');
        
        // If plan was verified on server, we can redirect with minimal delay
        if (planData._verified === true) {
          setLoadingProgress("Plan verified! Redirecting...");
          setTimeout(() => {
            router.push(`/conversations/${targetId}?tab=plan${isRegenerating ? '&from=regenerate' : '&from=generate'}`);
          }, 1000);
          return;
        }
        
        // Plan needs polling - add initial delay before starting
        setLoadingProgress("Waiting for plan to be available...");
        
        // Wait 5 seconds before starting to poll
        setTimeout(() => {
          // Then set up polling
          let attempts = 0;
          const maxAttempts = 15;
          const checkInterval = 2000; // 2 seconds between checks
          
          async function checkAndRedirect() {
            try {
              setLoadingProgress(`Verifying plan (${attempts + 1}/${maxAttempts})...`);
              
              const checkResponse = await fetch(`/api/conversation-plan?chatId=${targetId}`);
              
              if (checkResponse.ok) {
                // Plan exists in read replica, safe to redirect
                router.push(`/conversations/${targetId}?tab=plan${isRegenerating ? '&from=regenerate' : '&from=generate'}`);
                return;
              }
              
              // Plan not found yet
              attempts++;
              
              if (attempts >= maxAttempts) {
                // If we exceed max attempts, redirect anyway with localStorage flag
                console.warn(`Plan verification timed out after ${maxAttempts} attempts`);
                router.push(`/conversations/${targetId}?tab=plan&useLocal=true${isRegenerating ? '&from=regenerate' : '&from=generate'}`);
                return;
              }
              
              // Try again after delay
              setTimeout(checkAndRedirect, checkInterval);
            } catch (error) {
              console.error('Error checking plan availability:', error);
              attempts++;
              
              if (attempts >= maxAttempts) {
                // Fallback to localStorage approach
                router.push(`/conversations/${targetId}?tab=plan&useLocal=true${isRegenerating ? '&from=regenerate' : '&from=generate'}`);
                return;
              }
              
              setTimeout(checkAndRedirect, checkInterval);
            }
          }
          
          // Start polling after initial delay
          checkAndRedirect();
        }, 5000);
      }
    } catch (error) {
      console.error('Error saving conversation details:', error)
      toast.error('Failed to save conversation details. Please try again.')
      setShowLoadingScreen(false) // Hide loading screen on error
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to get depth description based on turns
  const getDepthDescription = (turns: number): string => {
    if (turns >= 3 && turns <= 5) return "Quick"
    if (turns >= 6 && turns <= 10) return "Recommended"
    if (turns >= 11 && turns <= 16) return "Exploratory"
    if (turns >= 17 && turns <= 20) return "Deep Dive"
    return "Custom" // Fallback
  }

  // Helper function to estimate time - UPDATED
  const estimateTime = (turns: number): string => {
    const totalSeconds = turns * 30 // Changed 20 to 30
    const minutes = Math.floor(totalSeconds / 60)
    const remainingSeconds = totalSeconds % 60
    if (minutes === 0) return `≈ ${remainingSeconds} sec`
    if (remainingSeconds === 0) return `≈ ${minutes} min`
    // Simple decimal representation for partial minutes
    const decimalMinutes = (totalSeconds / 60).toFixed(1)
    return `≈ ${decimalMinutes} min`
  }

  // Helper function to format the duration string for the backend
  const formatDurationString = (turns: number): string => {
    const description = getDepthDescription(turns);
    const timeEstimate = estimateTime(turns); // This will now use the 30s calculation
    return `${timeEstimate} (${description}) - ${turns} turns`;
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
      {showLoadingScreen && <LoadingScreen progress={loadingProgress} />}
      
      {/* Card 1: Topic */}
      <div ref={cardRefs.card1}>
        <div className="border rounded-lg p-8 bg-[#FAFAFA] w-full">
          <h3 className="text-base font-medium mb-2 flex items-center">
            What do you want to learn from your customers?
            <StatusDot active={hasContent(1)} />
          </h3>
          <p className="text-sm text-gray-500 mb-6">Select an example topic below to start—edit freely, it's just a starting point.</p>
          
          <div className="space-y-6 mb-8">
            <div className="flex flex-wrap gap-3">
              {/* Start from Scratch button */}
              <button
                onClick={handleStartFromScratch}
                className={cn(
                  "px-4 py-2 text-sm rounded-full transition-all shadow-sm flex items-center",
                  hasInitiatedTopic && topic.trim() === ""
                    ? "bg-black text-white shadow-sm"
                    : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200",
                )}
              >
                <PenLine className="w-3.5 h-3.5 text-blue-500 mr-2" />
                Start from Scratch
              </button>
              
              {/* Template options */}
              {conversationTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => handleTemplateSelect(template.prompt)}
                  className={cn(
                    "px-4 py-2 text-sm rounded-full transition-all shadow-sm flex items-center",
                    hasInitiatedTopic && topic === template.prompt
                      ? "bg-black text-white shadow-sm"
                      : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200",
                  )}
                >
                  {template.icon && <template.icon className="w-3.5 h-3.5 text-blue-500 mr-2" />}
                  {template.title}
                </button>
              ))}
            </div>
          </div>
          
          {hasInitiatedTopic && (
            <>
              <h3 className="text-base font-medium mb-2 flex items-center">
                Your Instructions
              </h3>
              <p className="text-sm text-gray-500 mb-4">Briefly describe what you're looking to learn. This can be anything you want—you're not limited to the topics above.</p>
              
              <TextareaAutosize
                value={topic}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTopic(e.target.value)}
                placeholder="e.g., I want to learn why customers decide to cancel—so we can reduce churn."
                className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mb-2 resize-none"
                minRows={5}
                maxRows={20}
              />
            </>
          )}
        </div>
        
        {visibleCards === 1 && (
          <div className="flex justify-end mt-5">
            <Button 
              onClick={showNextCard} 
              className="bg-black text-white hover:bg-gray-800 h-9 text-xs px-5"
              disabled={!hasContent(1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
      
      {/* Card 2: Duration (Slider) - Revised UI */}
      {visibleCards >= 2 && (
        <div ref={cardRefs.card2}>
          <div className="border rounded-lg p-8 bg-[#FAFAFA] w-full">
            <h3 className="text-base font-medium mb-2 flex items-center">
              Set the Conversation Length
              <StatusDot active={hasContent(2)} />
            </h3>
            <p className="text-sm text-gray-500 mb-8">
              Choose the number of conversational turns (questions/responses) the agent should aim for.
            </p>

            {/* Container for Slider and Badges - Left Aligned */}
            <div className="max-w-3xl space-y-4">
              {/* Slider Block */}
              <div className="space-y-2">
                 <Slider
                  value={[numTurns]}
                  onValueChange={handleTurnsChange}
                  min={3}
                  max={20}
                  step={1}
                   className={cn(
                     "w-full cursor-pointer"
                   )}
                  aria-label="Number of conversation turns"
                />
                {/* Min/Max Labels below slider */}
                <div className="flex justify-between text-xs text-gray-500 px-1">
                  <span>3 Turns (Min)</span>
                  <span>20 Turns (Max)</span>
                </div>
              </div>

              {/* Badges Block - Centered Below Slider */}
              <div className="flex justify-center items-center space-x-3 pt-2">
                 {/* Turn Count Badge */}
                <Badge variant="outline" className="bg-white px-3 py-1.5 shadow-sm border-gray-200">
                  <MessageSquare className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">{numTurns} Turns</span>
                </Badge>
                {/* Summary Badge (Softer Blue) */}
                 <Badge variant="default" className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1.5 shadow-sm border border-transparent">
                  <span className="text-sm font-medium">{getDepthDescription(numTurns)}</span>
                  <span className="mx-1.5 opacity-60">|</span>
                  <Clock className="w-4 h-4 mr-1 opacity-80" />
                  <span className="text-sm">{estimateTime(numTurns)}</span>
                </Badge>
              </div>
            </div>
          </div>

          {/* Next Button for Card 2 */}
          {visibleCards === 2 && (
            <div className="flex justify-end mt-5">
              <Button
                onClick={showNextCard}
                className="bg-black text-white hover:bg-gray-800 h-9 text-xs px-5"
                disabled={!hasContent(2)}
              >
                Next
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
                disabled={!hasContent(3)}
              >
                Next
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
            
            {incentiveStatus === true && (
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
          
          <div className="flex justify-end mt-8 space-x-4">
            {isRegenerating && (
              <Button
                onClick={() => router.push(`/conversations/${idVariable}?tab=plan`)}
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