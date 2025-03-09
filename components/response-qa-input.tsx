"use client"

import { useState, useRef, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, ArrowUp, Loader2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

interface Conversation {
  id: string
  title: string
  responseCount: number
  wordCount: number
}

interface ChatInputProps {
  selectedConversations: Conversation[]
  onConversationSelect: (conversation: Conversation, sessionId?: string) => void
  onConversationRemove: (conversationId: string) => void
  onMessageSubmit: (message: string) => void
  isSubmitting: boolean
  firstMessageSent?: boolean
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  sessionId?: string | null
}

export function ChatInput({
  selectedConversations,
  onConversationSelect,
  onConversationRemove,
  onMessageSubmit,
  isSubmitting = false,
  firstMessageSent = false,
  value = "",
  onChange,
  sessionId
}: ChatInputProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [isLoadingAny, setIsLoadingAny] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [value])

  const fetchConversations = async () => {
    setIsLoadingConversations(true)
    try {
      console.log("Fetching conversations from API...")
      const response = await fetch("/api/chat-instances/with-responses")
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API error (${response.status}):`, errorText)
        throw new Error(`Failed to fetch conversations: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      console.log("Received conversations data:", data)
      
      if (!data.conversations) {
        console.warn("No conversations array in response:", data)
      }
      
      // Filter out conversations that have already been selected
      const filteredConversations = (data.conversations || []).filter(
        (conv: Conversation) => !selectedConversations.some(
          selected => selected.id === conv.id
        )
      );
      
      setConversations(filteredConversations)
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const handleConversationSelect = async (conversation: Conversation) => {
    setLoadingConversationId(conversation.id);
    setIsLoadingAny(true);
    setIsPopoverOpen(false);
    
    try {
      let currentSessionId = sessionId;
      
      // Only create a new session if one doesn't exist yet
      if (!currentSessionId) {
        // Create a new internal chat session
        const response = await fetch("/api/internal-chat/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatInstanceIds: [conversation.id],
            title: conversation.title,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create chat session");
        }

        const { session } = await response.json();
        currentSessionId = session.id;
      }
      
      // Process the context data for this session
      const contextResponse = await fetch("/api/internal-chat/process-context", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          chatInstanceIds: [conversation.id],
        }),
      });
      
      if (!contextResponse.ok) {
        const error = await contextResponse.json();
        throw new Error(error.error || "Failed to process context data");
      }
      
      // Call the parent's onConversationSelect with the session ID
      if (!selectedConversations.some(c => c.id === conversation.id)) {
        onConversationSelect(conversation, currentSessionId ?? undefined);
      }
      
    } catch (error) {
      console.error("Error selecting conversation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to select conversation",
        variant: "destructive",
      });
      
      // Still add the conversation even if session creation fails
      if (!selectedConversations.some(c => c.id === conversation.id)) {
        onConversationSelect(conversation);
      }
    } finally {
      // Add a short delay before removing loading state to ensure UI feedback is visible
      setTimeout(() => {
        setLoadingConversationId(null);
        setIsLoadingAny(false);
      }, 500);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (value.trim() && !isSubmitting) {
      onMessageSubmit(value.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow new lines with Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // Only submit if conditions are met
      if (value.trim() && !isSubmitting && selectedConversations.length > 0) {
        onMessageSubmit(value.trim());
      }
    }
  };

  return (
    <div className="w-full bg-white pt-2">
      <div className="mx-auto max-w-4xl px-4 md:px-8 lg:px-12 pb-4">
        <div className="relative flex flex-col rounded-xl border bg-white shadow-[0_0_15px_rgba(0,0,0,0.1)] [&:has(:focus)]:shadow-[0_0_15px_rgba(0,0,0,0.1)] [&:has(:focus)]:border-transparent">
          {selectedConversations.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 px-8 border-b">
              {selectedConversations.map((conv) => (
                <div key={conv.id} className="flex items-center gap-2 bg-gray-50 rounded-lg border px-3 py-2 text-sm">
                  <span className="font-medium">{conv.title}</span>
                  <span className="text-xs text-gray-500">
                    ({conv.responseCount} responses, {conv.wordCount} words)
                  </span>
                </div>
              ))}
            </div>
          )}
          <form className="flex flex-col gap-2 p-2 px-8" onSubmit={handleSubmit}>
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your responses..."
              className={cn(
                "w-full resize-none px-3 py-2.5 transition-all duration-200",
                "border-0 outline-none focus:outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                "bg-transparent text-base leading-relaxed",
                "disabled:bg-gray-50 disabled:cursor-not-allowed",
              )}
              style={{
                minHeight: "64px",
                maxHeight: "200px",
                overflowY: value.split("\n").length > 3 ? "auto" : "hidden",
              }}
              disabled={isSubmitting}
            />
            <div className="flex justify-end gap-2 items-center">
              <Popover open={isPopoverOpen && !isLoadingAny} onOpenChange={(open) => {
                if (!isLoadingAny) {
                  setIsPopoverOpen(open);
                  if (open) fetchConversations();
                }
              }}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-3 text-xs"
                    disabled={isSubmitting || isLoadingAny}
                  >
                    {isLoadingAny ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 mr-1" />
                        Add Responses
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 shadow-lg" align="end" side="top" sideOffset={10}>
                  <div className="mb-3">
                    <h3 className="font-medium">Conversations</h3>
                    <p className="text-sm text-muted-foreground">Select a conversation to add responses</p>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {isLoadingConversations ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : conversations.length > 0 ? (
                      conversations.map((conversation) => (
                        <ConversationCard
                          key={conversation.id}
                          conversation={conversation}
                          onSelect={handleConversationSelect}
                          isLoading={loadingConversationId === conversation.id}
                          isSelected={selectedConversations.some((conv) => conv.id === conversation.id)}
                        />
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No additional conversations available
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 rounded-lg transition-colors bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400"
                disabled={isSubmitting || !value.trim() || selectedConversations.length === 0}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ArrowUp className="h-3 w-3" />
                )}
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

interface ConversationCardProps {
  conversation: Conversation
  onSelect: (conversation: Conversation) => void
  isLoading: boolean
  isSelected: boolean
}

function ConversationCard({ conversation, onSelect, isLoading, isSelected }: ConversationCardProps) {
  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-colors",
        isSelected ? "bg-gray-50 border-gray-300" : "hover:bg-gray-50 border-gray-200",
        "cursor-pointer shadow-sm hover:shadow",
      )}
      onClick={() => !isLoading && !isSelected && onSelect(conversation)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{conversation.title}</h4>
          <div className="flex gap-3 text-xs text-muted-foreground mt-1">
            <span>{conversation.responseCount} responses</span>
            <span>{conversation.wordCount} words</span>
          </div>
        </div>
        <div>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 text-xs",
                isSelected ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-gray-100",
              )}
              disabled={isSelected}
            >
              {isSelected ? <Check className="h-3.5 w-3.5 mr-1" /> : null}
              {isSelected ? "Selected" : "Select"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}