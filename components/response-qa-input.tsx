"use client"

import { useState, useRef, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, ArrowUp, Loader2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Conversation {
  id: string
  title: string
  responseCount: number
  wordCount: number
}

interface ChatInputProps {
  conversations: Conversation[]
  selectedConversations: Conversation[]
  onConversationSelect: (conversation: Conversation) => void
  onConversationRemove: (conversationId: string) => void
  onMessageSubmit: (message: string) => void
  isSubmitting: boolean
}

export function ChatInput({
  conversations,
  selectedConversations,
  onConversationSelect,
  onConversationRemove,
  onMessageSubmit,
  isSubmitting = false
}: ChatInputProps) {
  const [value, setValue] = useState("")
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [value])

  const handleSelectConversation = (conversation: Conversation) => {
    setLoadingConversationId(conversation.id)

    // Simulate loading state
    setTimeout(() => {
      onConversationSelect(conversation)
      setLoadingConversationId(null)
      setIsPopoverOpen(false)
    }, 500)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (value.trim() && !isSubmitting) {
      onMessageSubmit(value.trim())
      setValue("")
    }
  }

  return (
    <div className="w-full bg-[#F9F8F6] pt-2">
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
                  <button
                    onClick={() => onConversationRemove(conv.id)}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove conversation</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          <form className="flex flex-col gap-2 p-2 px-8" onSubmit={handleSubmit}>
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
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
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-3 text-xs"
                    disabled={isSubmitting}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Responses
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 shadow-lg" align="end" side="top" sideOffset={10}>
                  <div className="mb-3">
                    <h3 className="font-medium">Conversations</h3>
                    <p className="text-sm text-muted-foreground">Select a conversation to add responses</p>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {conversations.map((conversation) => (
                      <ConversationCard
                        key={conversation.id}
                        conversation={conversation}
                        onSelect={handleSelectConversation}
                        isLoading={loadingConversationId === conversation.id}
                        isSelected={selectedConversations.some((conv) => conv.id === conversation.id)}
                      />
                    ))}
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