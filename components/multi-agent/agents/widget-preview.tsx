"use client"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserIcon, ArrowLeft, Loader2, ChevronRight, User, X } from "lucide-react"
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
import { useSharedModalCore } from "@/components/chat/use-shared-modal-core"
import { PreChatForm } from "@/components/embed/pre-chat-form"
import { useUsage } from "@/contexts/usage-context"
import { UsageExceededOverlay } from "@/components/multi-agent/usage-exceeded-overlay"

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
  /**
   * Where the embed is rendered. "modal" = overlay inside host page; "standalone" = full tab.
   * Defaults to "standalone" for backwards compatibility.
   */
  displayMode?: "modal" | "standalone"
  /**
   * Optional close handler – shown as ❌ on the agent-selection screen when displayMode="modal".
   */
  onClose?: () => void
  /** When true, require the visitor to fill pre-chat form after selecting an agent */
  requirePreChatForm?: boolean
}

// Per-agent colour support removed per design guidelines. We now use the Franko lime palette consistently.

// Completion animation component
function CompletionAnimation({ agent, onAnimationComplete }: { 
  agent: Agent | null; 
  onAnimationComplete: () => void;
}) {
  // Get the organization name for the message
  const getOrganizationName = () => {
    if (agent && typeof window !== 'undefined') {
      const orgName = (window as any).frankoOrgName || 
        (window as any).FrankoUser?.user_metadata?.organization_name ||
        "our";
      return orgName;
    }
    return "our";
  };

  const [stage, setStage] = useState<'appearing' | 'celebrating' | 'fading'>('appearing');

  useEffect(() => {
    const timer1 = setTimeout(() => setStage('celebrating'), 300);
    const timer2 = setTimeout(() => setStage('fading'), 2000);
    const timer3 = setTimeout(onAnimationComplete, 2800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onAnimationComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="relative mb-6">
        <div
          className={cn(
            "flex items-center justify-center w-16 h-16 rounded-full transition-all duration-500",
            "border-2 border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400",
            stage === "celebrating" && "scale-110"
          )}
        >
          <svg 
            className={cn(
              "w-8 h-8 text-green-600 dark:text-green-400 transition-all duration-500",
              stage === 'appearing' ? "scale-0 opacity-0" : "scale-100 opacity-100"
            )}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <div className={cn(
        "transition-all duration-500",
        stage === 'fading' && "opacity-0 transform translate-y-4"
      )}>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Thank You!</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Your feedback has been sent to the {getOrganizationName()} team.
        </p>
      </div>
    </div>
  );
}

function PoweredByFooter({ gradient, borderColor }: { gradient: string, borderColor: string }) {
  return (
    <div
      className="px-4 flex items-center justify-center gap-1.5 border-t py-2 text-xs font-medium"
      style={{
        background: gradient,
        borderColor: borderColor,
        color: '#7A7A82'
      }}
    >
      <a 
        href="https://franko.ai" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
      >
        <Image src="/favicon/grey-icon.svg" alt="Franko.ai" width={14} height={14} className="opacity-60" />
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
  alignChatBubble = "custom",
  isPlayground = false,
  onAgentSelect,
  loadingAgentId,
  modalId,
  isEmbedMode = false,
  organizationName,
  displayMode = "standalone",
  onClose,
  requirePreChatForm = false,
}: WidgetPreviewProps) {
  // Instantiate shared modal core once at the top so it is available to subsequent destructuring
  const coreDemo = useSharedModalCore()

  const {
    selectedAgent,
    messages,
    inputValue,
    setInputValue,
    setMessages,
  } = coreDemo as unknown as {
    selectedAgent: Agent | null;
    messages: Message[];
    inputValue: string;
    setInputValue: (val: string) => void;
    setMessages: (fn: (prev: Message[]) => Message[]) => void;
  }
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [chatInstanceId, setChatInstanceId] = useState<string | null>(null)
  const [chatResponseId, setChatResponseId] = useState<string | null>(null)
  const [resolvedOrgName, setResolvedOrgName] = useState<string | null>(null)
  const [popoverAgentId, setPopoverAgentId] = useState<string | null>(null)
  const popoverTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Usage checking - only show overlay when confirmed exceeded
  const { isUsageExceeded } = useUsage()

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
        alignChatBubble: alignChatBubble || "custom",
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
        theme: contextData?.settings?.interface?.theme || "light",
        primaryBrandColor: "",
        advancedColors: false,
        chatIconText: "Feedback",
        chatIconColor: "",
        userMessageColor: "",
        chatHeaderColor: null,
        alignChatBubble: "custom",
        profilePictureUrl: null,
      },
      agents: { enabledAgents: {} }
    };
  }

  const getProcessedPrompt = (prompt: string) => {
    // Use resolved organization name from initialization first, then fallback chain
    const orgName = resolvedOrgName || 
      (isEmbedMode && organizationName ? organizationName : null) ||
      contextData?.profile?.organisationName || 
      settings.interface.displayName || 
      "your product";
    return prompt.replace(/{organisation_name}/g, orgName).replace(/{product}/g, orgName);
  }
  
  const currentTheme = settings.interface.theme;
  const themeDefaults = {
    light: { headerColor: "#ffffff", userMessageColor: "#3B82F6", chatIconColor: "#000000", borderColor: "rgba(0,0,0,0.06)" },
    dark: { headerColor: "#18181b", userMessageColor: "#3B82F6", chatIconColor: "#ffffff", borderColor: "rgba(255,255,255,0.1)" }
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

  // Centralized gradient values for easy adjustment
  const themeGradients = {
    light: `linear-gradient(to bottom, ${effectiveChatHeaderColor}, rgba(0,0,0,0.02))`,
    dark: `linear-gradient(to bottom, ${effectiveChatHeaderColor}, #222225)`
  };

  // Use solid color if brand color is set, otherwise use gradient
  const shouldUseGradient = !primaryBrandColor;
  const headerBackground = shouldUseGradient ? themeGradients[currentTheme] : effectiveChatHeaderColor;

  const headerStyles = {
    ...getColorStyles(effectiveChatHeaderColor, true),
    background: headerBackground,
    borderColor: themeDefaults[currentTheme].borderColor,
  }
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
    coreDemo.handleConversationComplete();
  }, [coreDemo]);

  const handleAnimationComplete = useCallback(() => {
    coreDemo.handleReturnToSelection();
  }, [coreDemo]);

  // Pre-chat form state (post agent selection)
  const [queuedAgent, setQueuedAgent] = useState<Agent | null>(null)
  const [showPreChatForm, setShowPreChatForm] = useState(false)

  const handleAgentSelect = async (agent: Agent) => {
    // Intercept: require form first
    if (requirePreChatForm && !(window as any).FrankoUser?.user_metadata?.email) {
      setQueuedAgent(agent)
      setShowPreChatForm(true)
      return
    }

    if (onAgentSelect) {
      onAgentSelect(agent);
      return;
    }

    if (isPlayground) {
      // Show loading state immediately for playground mode
      coreDemo.setView("loading")
      const targetModalId = isEmbedMode ? modalId : currentModal?.id;
      
      if (!targetModalId) {
        console.error('No modal ID available for playground testing');
        return;
      }

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
        setResolvedOrgName(data.organizationName);
        
        console.log('WidgetPreview - Chat initialized:', {
          agentId: agent.id,
          agentName: agent.name,
          chatInstanceId: data.chatInstanceId,
          chatResponseId: data.chatResponseId,
          organizationName: data.organizationName
        });
        
        // After successful init switch to chatting via shared handler
        coreDemo.handleAgentSelect(agent)
      } catch (error) {
        console.error('Error initializing chat:', error);
        coreDemo.handleReturnToSelection();
        setResolvedOrgName(null);
      }
    } else {
      // Reset modal core to selection state and show popup
      coreDemo.handleReturnToSelection()
      setPopoverAgentId(agent.id)
      if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current)
      popoverTimerRef.current = setTimeout(() => setPopoverAgentId(null), 3000)
    }
  }

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return
    setMessages((prevMessages: Message[]) => [
      ...prevMessages,
      { id: `user-${Date.now()}`, text: inputValue, sender: "user", timestamp: Date.now() },
    ])
    setInputValue("")
  }

  const handleReturnToSelection = () => {
    coreDemo.handleReturnToSelection()
    setResolvedOrgName(null)
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

  const handlePreChatSubmit = (data: { name: string; email: string }) => {
    // Save in window.FrankoUser
    if (typeof window !== 'undefined') {
      (window as any).FrankoUser = {
        user_id: null,
        user_hash: null,
        user_metadata: {
          name: data.name,
          email: data.email,
          source: "agent_selection_form"
        }
      }
    }
    setShowPreChatForm(false)
    if (queuedAgent) {
      handleAgentSelect(queuedAgent)
      setQueuedAgent(null)
    }
  }

  const renderAgentSelectionView = () => (
    <>
      {displayMode === "modal" && onClose && (
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="absolute top-3 right-3 z-10 h-8 w-8 flex items-center justify-center rounded-full focus:outline-none transition-colors"
          style={{
            top: "calc(env(safe-area-inset-top) + 12px)",
            color: pickTextColor(effectiveChatHeaderColor),
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = currentTheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <X className="h-5 w-5" />
        </button>
      )}
      <div 
        className={cn("px-6 py-5 flex flex-col gap-2 border-b")} 
        style={{
          ...headerStyles,
          borderColor: themeDefaults[currentTheme].borderColor,
          background: headerBackground
        }}
      >
        <div className="flex items-start gap-4">
          {profilePictureUrl && (
            <Avatar className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
              <AvatarImage src={profilePictureUrl || undefined} alt="Profile Picture" className="object-cover" />
              <AvatarFallback className="rounded-full">
                <UserIcon className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex flex-col min-h-[40px] justify-center">
            <h1 
              className="text-lg font-semibold leading-tight"
              style={{ color: pickTextColor(effectiveChatHeaderColor) }}
            >{displayHeaderName}</h1>
            <p 
              className="mt-1 text-sm hidden sm:block"
              style={{ color: `${pickTextColor(effectiveChatHeaderColor)}99` }}
            >{displayInstructions}</p>
          </div>
        </div>
      </div>
      <div className={cn("px-6 py-4 flex-grow overflow-y-auto")} style={{ backgroundColor: headerDefaultColor }}>
        {activeAgents.length > 0 ? (
          <div className="space-y-2 md:space-y-3">
            {activeAgents.map((agent) => (
              <Popover key={agent.id} open={!isPlayground && popoverAgentId === agent.id}>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => handleAgentSelect(agent)}
                    disabled={isPlayground && loadingAgentId === agent.id}
                    className={cn(
                      "w-full rounded-lg px-4 py-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      currentTheme === "dark" 
                        ? "bg-gray-700/45 hover:bg-gray-700/60" 
                        : "bg-slate-50/70 border border-gray-200 hover:border-gray-300",
                      isPlayground && loadingAgentId === agent.id
                        ? "opacity-70 cursor-not-allowed"
                        : "hover:translate-x-0.5 hover:translate-y-0 active:translate-y-0.5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-gray-400/70" />
                        <p className={cn(
                          "text-[15px] leading-snug",
                          currentTheme === "dark" ? "text-gray-100" : "text-gray-700"
                        )}>
                          {getProcessedPrompt(agent.prompt)}
                        </p>
                      </div>
                      {isPlayground && loadingAgentId === agent.id && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#E4F222" }} />
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
          {(isPlayground || displayMode === "modal") && (
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
          )}
          <div className="flex-1 min-h-0">
            <ModalExternalChat
              chatInstanceId={chatInstanceId}
              chatResponseId={chatResponseId}
              agentType={selectedAgent?.id}
              organizationName={resolvedOrgName || organizationName || "our product"}
              onConversationComplete={handleConversationComplete}
              initialMessages={[]}
              disableProgressBar={false}
              bodyBackground={currentTheme === "dark" ? "#000000" : "#ffffff"}
              hideProgressBarUI={true}
            />
          </div>
        </div>
      )
    } else {
      return (
        <>
          {(isPlayground || displayMode === "modal") && (
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
          )}
          <div ref={messagesContainerRef} className="flex-grow overflow-y-auto px-4 md:px-8 lg:px-14 py-6 space-y-4" style={{ backgroundColor: headerDefaultColor }}>
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={cn("flex", message.sender === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-xs lg:max-w-md px-4 py-2 rounded-lg text-sm",
                      message.sender === "user"
                        ? currentTheme === "dark" 
                          ? "text-white"
                          : "bg-slate-50/70 text-gray-700"
                        : currentTheme === "dark"
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-900"
                    )}
                    style={{
                      backgroundColor: message.sender === "user" && currentTheme === "dark" ? effectiveUserMessageColor : undefined,
                      color: message.sender === "user" && currentTheme === "dark" ? userMessageTextColor : undefined,
                    }}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="border-t p-4">
            <div className="max-w-4xl mx-auto">
              <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Type your message..." className="flex-grow" />
                <Button type="submit" size="sm">Send</Button>
              </form>
            </div>
          </div>
        </>
      )
    }
  }

  const renderCompletionView = () => (
    <CompletionAnimation agent={selectedAgent} onAnimationComplete={handleAnimationComplete} />
  )

  // Overlay PreChatForm when required
  const preChatOverlay = showPreChatForm ? (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <PreChatForm onSubmit={handlePreChatSubmit} onCancel={() => {setShowPreChatForm(false); setQueuedAgent(null);}} theme={currentTheme} />
    </div>
  ) : null

  // Fixed dimensions for consistent modal sizing
  // Use responsive classes that work within containers
  const cardHeightClasses = "h-[600px] max-md:h-full"
  const cardMaxWidth = "max-w-[800px] max-lg:max-w-[640px] max-md:max-w-none"

  return (
    <Card 
      className={cn(
        "w-full mx-auto shadow-lg overflow-hidden flex flex-col relative", 
        cardHeightClasses, 
        cardMaxWidth,
        // Remove default Card border in embed mode, otherwise keep a border
        isEmbedMode ? "border-0" : "border"
      )}
      style={{
        // Apply border color in non-embed mode; ensure no border in embed mode
        ...(isEmbedMode ? { border: "none" } : { borderColor: themeDefaults[currentTheme].borderColor }),
      }}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {coreDemo.view === 'agent-selection' && renderAgentSelectionView()}
        {coreDemo.view === 'loading' && renderLoadingView()}
        {coreDemo.view === 'chatting' && renderChatView()}
        {coreDemo.view === 'completion' && renderCompletionView()}
      </div>
      <PoweredByFooter 
        gradient={headerBackground}
        borderColor={themeDefaults[currentTheme].borderColor}
      />
      {displayMode === "modal" && alignChatBubble !== "custom" && coreDemo.view === "agent-selection" && !isEmbedMode && (
        <FloatingChatIcon
          text={chatIconText || "Feedback"}
          backgroundColor={effectiveChatIconColor}
          position={alignChatBubble as "left" | "right"}
        />
      )}
      {preChatOverlay}
      {isUsageExceeded && coreDemo.view === 'agent-selection' && (
        <UsageExceededOverlay currentTheme={currentTheme} />
      )}
    </Card>
  )
}

export default WidgetPreview; 