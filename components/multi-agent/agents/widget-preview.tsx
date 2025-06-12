"use client"
import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserIcon, RefreshCw, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Agent } from "@/lib/agents-data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getColorStyles, pickTextColor } from "@/lib/color-utils"

type Message = {
  id: string
  text: string
  sender: "agent" | "user"
  timestamp: number
}

export type WidgetPreviewProps = {
  activeAgents: Agent[]
  displayName?: string
  instructions?: string
  themeOverride?: "light" | "dark"
  primaryBrandColor?: string
  advancedColors?: boolean
  chatIconText?: string // For the separate chat icon button, not used directly in widget preview chat
  chatIconColor?: string // For the separate chat icon button
  profilePictureUrl?: string | null
  userMessageColor?: string // For user's chat bubbles
  chatHeaderColor?: string | null // For the chat header background
  alignChatBubble?: "left" | "right" | "custom" // For chat icon positioning
}

export function WidgetPreview({
  activeAgents,
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
}: WidgetPreviewProps) {
  const [viewMode, setViewMode] = useState<"agentSelection" | "chatView">("agentSelection")
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const currentTheme = themeOverride || "light"
  
  // Define theme defaults
  const themeDefaults = {
    light: {
      headerColor: "#ffffff",
      userMessageColor: "#3B81F6",
      chatIconColor: "#3B82F6"
    },
    dark: {
      headerColor: "#18181b", // Using one of the specified dark colors
      userMessageColor: "#3B81F6", 
      chatIconColor: "#3B82F6"
    }
  }
  
  // Use primary brand color when not in advanced mode, otherwise use individual colors
  // Fall back to theme defaults when colors are empty
  const effectiveUserMessageColor = advancedColors 
    ? (userMessageColor || themeDefaults[currentTheme].userMessageColor)
    : (primaryBrandColor || themeDefaults[currentTheme].userMessageColor)
    
  const effectiveChatHeaderColor = advancedColors 
    ? (chatHeaderColor || themeDefaults[currentTheme].headerColor)
    : (primaryBrandColor || themeDefaults[currentTheme].headerColor)
    
  const effectiveChatIconColor = advancedColors 
    ? (chatIconColor || themeDefaults[currentTheme].chatIconColor)
    : (primaryBrandColor || themeDefaults[currentTheme].chatIconColor)

  // Generate gradient styles for header
  const headerStyles = getColorStyles(effectiveChatHeaderColor, true)
  
  // Generate text color for user message bubbles
  const userMessageTextColor = pickTextColor(effectiveUserMessageColor)
  
  // Generate text color for chat icon button
  const chatIconTextColor = pickTextColor(effectiveChatIconColor)

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

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent)
    setMessages([
      {
        id: "agent-initial",
        text: "This is a preview. Navigate to the playground to test out your agents.",
        sender: "agent",
        timestamp: Date.now(),
      },
    ])
    setViewMode("chatView")
  }

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: `user-${Date.now()}`,
        text: inputValue,
        sender: "user",
        timestamp: Date.now(),
      },
    ])
    setInputValue("")
  }

  const handleReturnToSelection = () => {
    setViewMode("agentSelection")
    setSelectedAgent(null)
    setMessages([])
  }

  const renderAgentSelectionView = () => (
    <>
      <div
        className={cn("h-40 px-6 py-8 flex flex-col justify-center relative")}
        style={headerStyles}
      >
        {profilePictureUrl && (
          <Avatar className="absolute top-4 left-4 h-10 w-10 border-2 border-white/20 rounded-full overflow-hidden">
            <AvatarImage src={profilePictureUrl || undefined} alt="Profile Picture" className="object-cover" />
            <AvatarFallback className="rounded-full">
              <UserIcon className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        )}
        <h1 className={cn("text-2xl font-bold mb-2", profilePictureUrl ? "ml-14" : "")}>
          {displayHeaderName}
        </h1>
        <p className={cn("text-base opacity-90", profilePictureUrl ? "ml-14" : "")}>
          {displayInstructions}
        </p>
      </div>
      <div
        className={cn(
          "p-6 flex-grow overflow-y-auto", // Changed from "p-6 min-h-[200px]"
        )}
        style={{
          backgroundColor: currentTheme === "dark" ? "#000000" : "#ffffff"
        }}
      >
        {activeAgents.length > 0 ? (
          <div className="space-y-3">
            {activeAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => handleAgentSelect(agent)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-4 text-left shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{
                  backgroundColor: currentTheme === "dark" ? "#1f1f22" : "#fafafa"
                }}
              >
                <p className="font-medium text-gray-800 dark:text-gray-200">{agent.prompt}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full pt-10">
            <p className="text-center text-gray-500 dark:text-gray-400">
              Enable an agent on the left to see its starting prompt here.
            </p>
          </div>
        )}
      </div>
    </>
  )

  const renderChatView = () => (
    <>
      <div
        className={cn("h-20 px-4 py-2 flex items-center justify-between relative")}
        style={headerStyles}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReturnToSelection}
          className={cn(
            "text-white/80 hover:text-white hover:bg-white/10",
            "transition-colors",
          )}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1 justify-center">
          {profilePictureUrl && (
            <Avatar className="h-10 w-10 border-2 border-white/20 rounded-full overflow-hidden">
              <AvatarImage src={profilePictureUrl || undefined} alt="Profile Picture" className="object-cover" />
              <AvatarFallback className="rounded-full">
                <UserIcon className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          )}
          <h2 className={cn("text-lg font-semibold")}>Share Your Thoughts</h2>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className={cn(
          "p-4 flex-grow overflow-y-auto h-[calc(100%-140px)]", // Adjust height based on header and footer
        )}
        style={{
          backgroundColor: currentTheme === "dark" ? "#000000" : "#ffffff"
        }}
      >
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[70%] px-4 py-2.5 text-sm shadow-sm", // Added shadow-sm for a very subtle lift
                  msg.sender === "user"
                    ? "rounded-3xl rounded-br-lg border border-gray-200 px-4 py-2.5" // Match production style
                    : "rounded-2xl", // Assistant message bubble
                )}
                style={
                  msg.sender === "user" 
                    ? { 
                        backgroundColor: effectiveUserMessageColor, 
                        color: userMessageTextColor
                      } 
                    : {
                        backgroundColor: currentTheme === "dark" ? "#1f1f22" : "#fafafa",
                        color: currentTheme === "dark" ? "#ffffff" : "#000000"
                      }
                }
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div
        className={cn(
          "p-3 border-t",
        )}
        style={{
          backgroundColor: currentTheme === "dark" ? "#000000" : "#ffffff",
          borderColor: currentTheme === "dark" ? "#333333" : "#e5e7eb"
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Message..."
            className={cn(
              "flex-1 bg-transparent border-none shadow-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
              currentTheme === "dark"
                ? "text-gray-200 placeholder:text-gray-500"
                : "text-gray-800 placeholder:text-gray-400",
            )}
          />
          <Button
            type="submit"
            variant="ghost"
            className={cn(
              "p-2.5 h-auto w-auto",
              currentTheme === "dark" ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800",
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-10 h-10" fill="currentColor">
              <path
                fill="currentColor"
                d="M20.235 5.686c.432-1.195-.726-2.353-1.921-1.92L3.709 9.048c-1.199.434-1.344 2.07-.241 2.709l4.662 2.699 4.163-4.163a1 1 0 0 1 1.414 1.414L9.544 15.87l2.7 4.662c.638 1.103 2.274.957 2.708-.241z"
              />
            </svg>
          </Button>
        </form>
      </div>
    </>
  )

  return (
    <div className="relative w-[560px] mx-auto">
    <Card
      className={cn(
          "rounded-2xl overflow-hidden shadow-xl flex flex-col border-0",
        viewMode === "chatView" ? "h-[600px]" : "min-h-[400px] max-h-[700px]",
          currentTheme === "dark" ? "dark bg-gray-950" : "bg-white",
      )}
    >
      {viewMode === "agentSelection" ? renderAgentSelectionView() : renderChatView()}

      {/* Powered by Franko.ai Footer - Common for both views if structure allows, or duplicate */}
      {viewMode === "agentSelection" && (
        <div
          className={cn(
            "px-4 flex items-center justify-center gap-1.5 border-t py-2",
          )}
          style={{
            backgroundColor: currentTheme === "dark" ? "#161618" : "#fafafa",
            borderColor: currentTheme === "dark" ? "#333333" : "#e5e7eb"
          }}
        >
          <img src="/assets/franko-chat-icon.svg" alt="Franko.ai" className="w-4 h-4 opacity-60" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Powered by Franko.ai</span>
        </div>
      )}
      {viewMode === "chatView" && ( // Footer for chat view
        <div
          className={cn(
            "px-4 flex items-center justify-center gap-1.5 border-t py-2 text-xs",
          )}
          style={{
            backgroundColor: currentTheme === "dark" ? "#161618" : "#fafafa",
            borderColor: currentTheme === "dark" ? "#333333" : "#e5e7eb",
            color: currentTheme === "dark" ? "#9ca3af" : "#6b7280"
          }}
        >
          <img src="/assets/franko-chat-icon.svg" alt="Franko.ai" className="w-4 h-4 opacity-60" />
          Powered by Franko.ai
        </div>
      )}
    </Card>

    {/* Floating Chat Button - Only show if not custom */}
    {alignChatBubble !== "custom" && (
      <button
        className={cn(
          "absolute top-full mt-4 px-3 py-1.5 rounded-full shadow-lg text-xs font-medium transition-all hover:shadow-xl",
          "flex items-center gap-1.5",
          alignChatBubble === "left" ? "left-0" : "right-0"
        )}
        style={{ 
          backgroundColor: effectiveChatIconColor,
          color: chatIconTextColor
        }}
        onClick={() => {/* Preview only - no action */}}
      >
        {chatIconText}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M20.235 5.686c.432-1.195-.726-2.353-1.921-1.92L3.709 9.048c-1.199.434-1.344 2.07-.241 2.709l4.662 2.699 4.163-4.163a1 1 0 0 1 1.414 1.414L9.544 15.87l2.7 4.662c.638 1.103 2.274.957 2.708-.241z"/>
        </svg>
      </button>
    )}
  </div>
  )
}