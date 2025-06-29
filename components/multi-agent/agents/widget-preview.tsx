"use client"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserIcon, ArrowLeft, Loader2, ChevronRight } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { Agent } from "@/lib/agents-data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getColorStyles, pickTextColor } from "@/lib/color-utils"
import { ModalExternalChat } from "@/components/modal-external-chat"
import { useSettings } from "@/lib/settings-context"
import { FloatingChatIcon } from "@/components/multi-agent/floating-chat-icon"
import { getAgentsByIds } from "@/lib/agents-data-client"

type Message = {
  id: string
  text: string
  sender: "agent" | "user"
  timestamp: number
}

type ModalState = 'agent-selection' | 'loading' | 'chatting' | 'completion'

export type WidgetPreviewProps = {
  // For server → client boundary: pass only serialisable IDs
  agentIds?: string[]
  // For purely client-side callers we still allow full Agent objects
  activeAgents?: Agent[]
  displayName?: string
  instructions?: string
  themeOverride?: "light" | "dark"
  primaryBrandColor?: string
  advancedColors?: boolean
  chatIconText?: string
  chatIconColor?: string
  profilePictureUrl?: string | null
  userMessageColor?: string
  chatHeaderColor?: string | null
  alignChatBubble?: "left" | "right" | "custom"
  isPlayground?: boolean
  onAgentSelect?: (agent: Agent) => void
  loadingAgentId?: string | null
  modalId?: string
  isEmbedMode?: boolean
  organizationName?: string
}

// Agent color mappings for Tailwind CSS
const getAgentColorClasses = (color: Agent['color']) => {
  const colorMap = {
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', bgDark: 'bg-cyan-500', iconBg: 'bg-cyan-100' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', bgDark: 'bg-amber-500', iconBg: 'bg-amber-100' },
    red: { bg: 'bg-red-100', text: 'text-red-600', bgDark: 'bg-red-500', iconBg: 'bg-red-100' },
    green: { bg: 'bg-green-100', text: 'text-green-600', bgDark: 'bg-green-500', iconBg: 'bg-green-100' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', bgDark: 'bg-blue-500', iconBg: 'bg-blue-100' },
    violet: { bg: 'bg-violet-100', text: 'text-violet-600', bgDark: 'bg-violet-500', iconBg: 'bg-violet-100' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', bgDark: 'bg-orange-500', iconBg: 'bg-orange-100' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-600', bgDark: 'bg-gray-500', iconBg: 'bg-gray-100' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', bgDark: 'bg-purple-500', iconBg: 'bg-purple-100' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', bgDark: 'bg-emerald-500', iconBg: 'bg-emerald-100' }
  };
  return colorMap[color] || colorMap.blue;
};

// Completion animation component
function CompletionAnimation({ agent, onAnimationComplete }: { 
  agent: Agent | null; 
  onAnimationComplete: () => void;
}) {
  const safeAgent = agent || {
    id: 'AGENT01',
    name: 'Agent',
    color: 'blue' as const,
    Icon: () => null
  };
  const [stage, setStage] = useState<'appearing' | 'celebrating' | 'fading'>('appearing');

  useEffect(() => {
    const timer1 = setTimeout(() => setStage('celebrating'), 500);
    const timer2 = setTimeout(() => setStage('fading'), 2500);
    const timer3 = setTimeout(onAnimationComplete, 3500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onAnimationComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="relative mb-6">
        <div className={cn(
          "absolute inset-0 rounded-full transition-all duration-1000",
          getAgentColorClasses(safeAgent.color).bg,
          stage === 'celebrating' && "scale-150 opacity-30"
        )} />
        <div className={cn(
          "relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-500",
          getAgentColorClasses(safeAgent.color).bgDark,
          "text-white",
          stage === 'celebrating' && "scale-110"
        )}>
          <safeAgent.Icon className="w-12 h-12" />
        </div>
      </div>
      <div className={cn(
        "transition-all duration-500",
        stage === 'fading' && "opacity-0 transform translate-y-4"
      )}>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Conversation Complete!</h3>
        <p className="text-gray-600">
          Great job! You've finished the <span className="font-medium">{safeAgent.name}</span> conversation.
        </p>
        <p className="text-sm text-gray-500 mt-2">You'll return to the agent selection in a moment...</p>
      </div>
    </div>
  );
}

function PoweredByFooter({ theme, backgroundColor }: { theme: 'light' | 'dark', backgroundColor: string }) {
  return (
    <div
      className="px-4 flex items-center justify-center gap-1.5 border-t py-3 text-xs font-medium"
      style={{
        backgroundColor: backgroundColor,
        borderColor: theme === 'dark' ? '#333333' : '#e5e7eb',
        color: '#7A7A82'
      }}
    >
      <a 
        href="https://franko.ai" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
      >
        <Image src="/assets/franko-chat-icon.svg" alt="Franko.ai" width={16} height={16} className="opacity-60" />
        <span>Powered By Franko.ai</span>
      </a>
    </div>
  );
}

export function WidgetPreview({
  agentIds,
  activeAgents: initialActiveAgents,
  displayName: customDisplayName,
  instructions: customInstructions,
  themeOverride,
  primaryBrandColor = "",
  advancedColors = false,
  profilePictureUrl,
  userMessageColor = "",
  chatHeaderColor,
  chatIconText,
  chatIconColor,
  alignChatBubble = "right",
  isPlayground = false,
  onAgentSelect,
  loadingAgentId,
  modalId,
  isEmbedMode = false,
  organizationName,
}: WidgetPreviewProps) {
  const [modalState, setModalState] = useState<ModalState>('agent-selection')
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [chatInstanceId, setChatInstanceId] = useState<string | null>(null)
  const [chatResponseId, setChatResponseId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [popoverAgentId, setPopoverAgentId] = useState<string | null>(null)
  const popoverTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Always call useSettings hook (no conditional calling)
  const contextData = useSettings();

  // Access settings context for modal ID (conditional data usage, not hook calling)
  let currentModal, settings;
  
  if (isEmbedMode) {
    // In embed mode, use props instead of context
    currentModal = null;
    settings = {
      interface: {
        displayName: customDisplayName || "Ready to share your thoughts with us?",
        instructions: customInstructions || "Each topic below starts a 1-2 minute chat.",
        theme: themeOverride || "light",
        primaryBrandColor: primaryBrandColor || "",
        advancedColors: advancedColors || false,
        chatIconText: chatIconText || "Feedback",
        chatIconColor: chatIconColor || "",
        userMessageColor: userMessageColor || "",
        chatHeaderColor: chatHeaderColor || null,
        alignChatBubble: alignChatBubble || "right",
        profilePictureUrl: profilePictureUrl || null,
      },
      agents: { enabledAgents: {} }
    };
  } else {
    // In playground mode, use context
    currentModal = contextData?.currentModal || null;
    settings = contextData?.settings || {
      interface: {
        displayName: customDisplayName || "Ready to share your thoughts with us?",
        instructions: customInstructions || "Each topic below starts a 1-2 minute chat.",
        theme: "light",
        primaryBrandColor: "",
        advancedColors: false,
        chatIconText: "Feedback",
        chatIconColor: "",
        userMessageColor: "",
        chatHeaderColor: null,
        alignChatBubble: "right",
        profilePictureUrl: null,
      },
      agents: { enabledAgents: {} }
    };
  }

  const getProcessedPrompt = (prompt: string) => {
    // Use the organization name from props if in embed mode, otherwise use profile data
    const orgName = isEmbedMode && organizationName 
      ? organizationName 
      : contextData?.profile?.organisationName || 
        settings.interface.displayName || 
        "your product";
    return prompt.replace(/{organisation_name}/g, orgName).replace(/{product}/g, orgName);
  }
  
  const currentTheme = themeOverride || "light"
  const themeDefaults = {
    light: { headerColor: "#ffffff", userMessageColor: "#3B82F6", chatIconColor: "#000000" },
    dark: { headerColor: "#18181b", userMessageColor: "#3B82F6", chatIconColor: "#ffffff" }
  }
  
  const effectiveUserMessageColor = advancedColors
    ? (userMessageColor || themeDefaults[currentTheme].userMessageColor)
    : (primaryBrandColor || themeDefaults[currentTheme].userMessageColor)
    
  const headerDefaultColor = themeDefaults[currentTheme].headerColor
  const effectiveChatHeaderColor = advancedColors 
    ? (chatHeaderColor || headerDefaultColor)
    : (primaryBrandColor || headerDefaultColor)

  const effectiveChatIconColor = advancedColors
    ? (chatIconColor || themeDefaults[currentTheme].chatIconColor)
    : (primaryBrandColor || themeDefaults[currentTheme].chatIconColor)

  const headerStyles = getColorStyles(effectiveChatHeaderColor, true)
  const userMessageTextColor = pickTextColor(effectiveUserMessageColor)

  const defaultDisplayName = "Ready to share your thoughts with us?"
  const defaultInstructions = "Each topic below starts a 1-2 minute chat."
  const displayHeaderName = customDisplayName || defaultDisplayName
  const displayInstructions = customInstructions || defaultInstructions

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(scrollToBottom, [messages])

  const handleConversationComplete = useCallback(() => {
    setModalState('completion');
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setModalState('agent-selection');
    setSelectedAgent(null);
    setChatInstanceId(null);
    setChatResponseId(null);
    setMessages([]);
  }, []);

  const handleAgentSelect = async (agent: Agent) => {
    if (onAgentSelect) {
      onAgentSelect(agent);
      return;
    }

    if (isPlayground) {
      const targetModalId = isEmbedMode ? modalId : currentModal?.id;
      
      if (!targetModalId) {
        console.error('No modal ID available for playground testing');
        return;
      }

      setSelectedAgent(agent);
      
      try {
        // Initialize chat in background
        const identityData = isEmbedMode ? ((window as any).FrankoUser || {}) : {};
        
        const response = await fetch('/api/modal-chat/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modalId: targetModalId,
            agentType: agent.id,
            intervieweeFirstName: null,
            intervieweeSecondName: null,
            intervieweeEmail: null,
            ...(isEmbedMode && identityData.user_id && {
              user_id: identityData.user_id,
              user_hash: identityData.user_hash,
              user_metadata: identityData.user_metadata
            })
          }),
        });

        if (!response.ok) throw new Error('Failed to initialize chat');

        const data = await response.json();
        setChatInstanceId(data.chatInstanceId);
        setChatResponseId(data.chatResponseId);
        
        console.log('WidgetPreview - Chat initialized:', {
          agentId: agent.id,
          agentName: agent.name,
          chatInstanceId: data.chatInstanceId,
          chatResponseId: data.chatResponseId,
          organizationName: data.organizationName
        });
        
        // Go straight to chatting - no loading state!
        setModalState('chatting');
      } catch (error) {
        console.error('Error initializing chat:', error);
        setModalState('agent-selection');
        setSelectedAgent(null);
      }
    } else {
      setPopoverAgentId(agent.id)
      if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current)
      popoverTimerRef.current = setTimeout(() => setPopoverAgentId(null), 3000)
    }
  }

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return
    setMessages((prevMessages) => [
      ...prevMessages,
      { id: `user-${Date.now()}`, text: inputValue, sender: "user", timestamp: Date.now() },
    ])
    setInputValue("")
  }

  const handleReturnToSelection = () => {
    setModalState('agent-selection')
    setSelectedAgent(null)
    setMessages([])
    setChatInstanceId(null)
    setChatResponseId(null)
  }

  // Resolve active agents: prefer explicit objects, otherwise map IDs to objects
  const activeAgents = useMemo<Agent[]>(
    () => {
      if (initialActiveAgents && initialActiveAgents.length > 0) {
        return initialActiveAgents
      }
      if (agentIds && agentIds.length > 0) {
        return getAgentsByIds(agentIds)
      }
      return []
    },
    [initialActiveAgents, agentIds]
  )

  const renderAgentSelectionView = () => (
    <>
      <div className={cn("px-6 py-6 flex flex-col gap-2 justify-center")} style={headerStyles}>
        <div className="flex items-center gap-4">
          {profilePictureUrl && (
            <Avatar className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
              <AvatarImage src={profilePictureUrl || undefined} alt="Profile Picture" className="object-cover" />
              <AvatarFallback className="rounded-full">
                <UserIcon className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <h1 className="text-2xl font-bold mb-1">{displayHeaderName}</h1>
            <p className="text-base opacity-90">{displayInstructions}</p>
          </div>
        </div>
      </div>
      <div className={cn("p-6 flex-grow overflow-y-auto")} style={{ backgroundColor: headerDefaultColor }}>
        {activeAgents.length > 0 ? (
          <div className="space-y-3">
            {activeAgents.map((agent) => (
              <Popover key={agent.id} open={!isPlayground && popoverAgentId === agent.id}>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => handleAgentSelect(agent)}
                    disabled={isPlayground && loadingAgentId === agent.id}
                    className={cn(
                      "w-full border border-gray-300 dark:border-gray-700 rounded-lg p-4 text-left shadow-sm hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isPlayground && loadingAgentId === agent.id
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    )}
                    style={{ backgroundColor: headerDefaultColor }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <p className={cn(
                          "font-normal leading-snug",
                          currentTheme === "dark" ? "text-white" : "text-gray-800"
                        )}>
                          {getProcessedPrompt(agent.prompt)}
                        </p>
                      </div>
                      {isPlayground && loadingAgentId === agent.id && (
                        <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#E4F222" }} />
                      )}
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="center" className="text-sm">
                  Head to the <span className="font-semibold">Playground</span> tab to test this conversation.
                </PopoverContent>
              </Popover>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className={cn("text-sm", currentTheme === "dark" ? "text-gray-400" : "text-gray-500")}>
              No agents selected. Configure agents in the Agents tab.
            </p>
          </div>
        )}
      </div>
    </>
  )

  const renderLoadingView = () => (
    <div className="flex flex-col items-center justify-center h-full p-8" style={{ backgroundColor: headerDefaultColor }}>
      <div className="flex items-center justify-center mb-6">
        {profilePictureUrl && (
          <Avatar className="h-16 w-16">
            <AvatarImage src={profilePictureUrl} alt="Logo" />
            <AvatarFallback>🏷</AvatarFallback>
          </Avatar>
        )}
      </div>
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2" style={{ color: pickTextColor(headerDefaultColor) }}>
          Starting Conversation...
        </h3>
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#E4F222" }} />
        </div>
      </div>
    </div>
  )

  const renderChatView = () => {
    if (isPlayground && chatInstanceId && chatResponseId) {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center px-6 py-4 border-b" style={headerStyles}>
            <Button variant="ghost" size="sm" onClick={handleReturnToSelection} className="mr-3 p-2 h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {profilePictureUrl && (
              <Avatar className="h-7 w-7 mr-3">
                <AvatarImage src={profilePictureUrl} alt="Logo" />
                <AvatarFallback>🏷</AvatarFallback>
              </Avatar>
            )}
            <h3 className="font-semibold text-sm">Quick Feedback Chat</h3>
          </div>
          <div className="flex-1 min-h-0">
            <ModalExternalChat
              chatInstanceId={chatInstanceId}
              chatResponseId={chatResponseId}
              agentType={selectedAgent?.id}
              organizationName={organizationName || "our product"}
              onConversationComplete={handleConversationComplete}
              initialMessages={[]}
              disableProgressBar={true}
              bodyBackground={currentTheme === "dark" ? "#000000" : "#ffffff"}
            />
          </div>
        </div>
      )
    } else {
      return (
        <>
          <div className="flex items-center px-6 py-4 border-b" style={headerStyles}>
            <Button variant="ghost" size="sm" onClick={handleReturnToSelection} className="mr-3 p-2 h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {profilePictureUrl && (
              <Avatar className="h-7 w-7 mr-3">
                <AvatarImage src={profilePictureUrl} alt="Logo" />
                <AvatarFallback>🏷</AvatarFallback>
              </Avatar>
            )}
            <h3 className="font-semibold text-sm">Quick Feedback Chat</h3>
          </div>
          <div ref={messagesContainerRef} className="flex-grow overflow-y-auto p-6 space-y-4" style={{ backgroundColor: headerDefaultColor }}>
            {messages.map((message) => (
              <div key={message.id} className={cn("flex", message.sender === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-xs lg:max-w-md px-4 py-2 rounded-lg text-sm",
                    message.sender === "user"
                      ? "text-white"
                      : currentTheme === "dark"
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-900"
                  )}
                  style={{
                    backgroundColor: message.sender === "user" ? effectiveUserMessageColor : undefined,
                    color: message.sender === "user" ? userMessageTextColor : undefined,
                  }}
                >
                  {message.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t p-4">
            <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
              <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Type your message..." className="flex-grow" />
              <Button type="submit" size="sm">Send</Button>
            </form>
          </div>
        </>
      )
    }
  }

  const renderCompletionView = () => (
    <CompletionAnimation agent={selectedAgent} onAnimationComplete={handleAnimationComplete} />
  )

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col relative">
      <div className="h-[650px] flex flex-col">
        {modalState === 'agent-selection' && renderAgentSelectionView()}
        {modalState === 'loading' && renderLoadingView()}
        {modalState === 'chatting' && renderChatView()}
        {modalState === 'completion' && renderCompletionView()}
      </div>
      <PoweredByFooter theme={currentTheme} backgroundColor={effectiveChatHeaderColor} />
      {alignChatBubble !== "custom" && modalState === "agent-selection" && (
        <FloatingChatIcon
          text={chatIconText || "Feedback"}
          backgroundColor={effectiveChatIconColor}
          position={alignChatBubble as "left" | "right"}
        />
      )}
    </Card>
  )
}

export default WidgetPreview; 