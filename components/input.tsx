"use client"

import { Textarea } from "@/components/ui/textarea"
import { ArrowUp, StopCircle } from "lucide-react"
import { useRef, useEffect, forwardRef, type ForwardedRef, useCallback, useState } from "react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import React from "react"

interface ChatInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  disabled?: boolean
  showProgressBar?: boolean
  progressBar?: React.ReactNode
  stop?: () => void
  messageContainerRef?: React.RefObject<HTMLDivElement>
}

function ChatInputComponent({ 
  value, 
  onChange, 
  onSubmit, 
  disabled,
  showProgressBar = false,
  progressBar,
  stop,
  messageContainerRef
}: ChatInputProps,
ref: ForwardedRef<HTMLTextAreaElement>) {
  const localRef = useRef<HTMLTextAreaElement>(null)
  const textareaRef = (ref || localRef) as React.RefObject<HTMLTextAreaElement>
  
  // Get window width to determine if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  // Set up isMobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Function to scroll to the bottom - more robust implementation
  const scrollToBottom = useCallback(() => {
    // Implementation for mobile
    if (isMobile) {
      // First try the direct ref from props if available
      if (messageContainerRef?.current) {
        console.log('Using direct ref to scroll container');
        // Scroll to bottom, not top
        messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        return;
      }
      
      // Try multiple selectors to find the message container
      const messageContainers = [
        document.querySelector('[data-message-container="true"]'),
        document.querySelector('.overflow-y-auto'),
        // Fallback to any scrollable container in the body
        ...Array.from(document.querySelectorAll('.overflow-y-auto')),
      ].filter(Boolean) as Element[];
      
      console.log('Found message containers:', messageContainers.length);
      
      // Try to scroll the first available container
      if (messageContainers.length > 0) {
        const container = messageContainers[0];
        console.log('Scrolling container to bottom', container);
        // Scroll to bottom of container
        container.scrollTop = container.scrollHeight;
      } else {
        console.warn('No scrollable container found for mobile scroll');
      }
    }
  }, [isMobile, messageContainerRef]);

  // Handle click on the textarea
  const handleTextareaClick = useCallback(() => {
    // Scroll to bottom when user clicks on the input
    scrollToBottom();
  }, [scrollToBottom]);

  // Memoize the height adjustment function
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit"
      const scrollHeight = textareaRef.current.scrollHeight
      
      // Use smaller heights on mobile
      const minHeight = isMobile ? 56 : 64;
      const maxHeight = isMobile ? 160 : 200;
      
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`
    }
  }, [textareaRef, isMobile]);

  // Update textarea height when value changes
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight])

  // Add effect to focus textarea when enabled
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [disabled, textareaRef])

  // Memoize keydown handler to avoid recreating function on each render
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    console.log("Key pressed:", e.key);
    console.log("Shift key pressed:", e.shiftKey);
    
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      console.log("Enter key pressed without shift");
      
      if (disabled) {
        console.log("Input is disabled, showing toast");
        toast.error("Please wait for the model to finish its response!")
        return
      }
      
      const form = e.currentTarget.form
      console.log("Form found:", !!form);
      
      if (form) {
        console.log("Submitting form via Enter key");
        onSubmit(new Event("submit") as unknown as React.FormEvent<HTMLFormElement>)
      }
    }
  }, [disabled, onSubmit]);

  // Memoize form submit handler
  const handleFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    console.log("Form submit event triggered in ChatInput");
    console.log("Form values:", { value });
    console.log("Is disabled:", disabled);
    onSubmit(e);
    
    // Scroll to the bottom when sending a message
    setTimeout(() => {
      scrollToBottom();
    }, 100); // Small delay to ensure UI updates first
  }, [onSubmit, value, disabled, scrollToBottom]);

  const hasContent = value.trim().length > 0

  return (
    <div className="w-full bg-[#F9F8F6] pt-1 md:pt-2" style={{ backgroundColor: "#F9F8F6", opacity: 1 }}>
      <div className="mx-auto max-w-4xl px-2 md:px-4 lg:px-8 pb-2 md:pb-4">
        <div className="relative flex flex-col rounded-lg md:rounded-xl border bg-white shadow-sm md:shadow-[0_0_15px_rgba(0,0,0,0.1)]" style={{ backgroundColor: "white", opacity: 1 }}>
          <form onSubmit={handleFormSubmit} className="flex items-start gap-2 p-1.5 md:p-2 px-3 md:px-8">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              onClick={handleTextareaClick}
              rows={1}
              placeholder="Send a message..."
              className={cn(
                "w-full resize-none px-2.5 md:px-3 py-2 md:py-2.5 transition-all duration-200 outline-none ring-0 focus:ring-0 border-0 bg-transparent text-sm md:text-base leading-relaxed",
                disabled && "bg-gray-50 cursor-not-allowed",
              )}
              style={{
                minHeight: "56px",
                maxHeight: "160px",
                overflowY: value.split('\n').length > 3 ? "auto" : "hidden"
              }}
              disabled={disabled}
            />
            {disabled && stop ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  stop()
                }}
                className={cn(
                  "p-2 rounded-lg transition-colors self-end mb-0 md:mb-1",
                  "bg-gray-900 text-white hover:bg-gray-800"
                )}
              >
                <StopCircle className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!hasContent || disabled}
                className={cn(
                  "p-2 rounded-lg transition-colors self-end mb-0 md:mb-1",
                  hasContent ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-gray-100 text-gray-400",
                  disabled && "opacity-50 cursor-not-allowed",
                )}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </form>
          
          {showProgressBar && (
            <div
              className={cn(
                "overflow-hidden transition-all duration-500 ease-in-out border-t",
                "max-h-12 md:max-h-16 opacity-100",
                "bg-gray-50/50"
              )}
            >
              <div className="px-2 md:px-4 py-1 md:py-2">
                {progressBar}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const ChatInput = React.memo(forwardRef<HTMLTextAreaElement, ChatInputProps>(ChatInputComponent));