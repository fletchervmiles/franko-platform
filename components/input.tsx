"use client"

import { Textarea } from "@/components/ui/textarea"
import { ArrowUp, StopCircle } from "lucide-react"
import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ProgressBar } from "./progress-bar"
import { toast } from "sonner"

interface ChatInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  disabled?: boolean
  showProgressBar?: boolean
  steps?: any[]
  stop?: () => void
}

export function ChatInput({ 
  value, 
  onChange, 
  onSubmit, 
  disabled,
  showProgressBar = false,
  steps = [],
  stop
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit"
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 64), 200)}px`
    }
  }, [value])

  // Add effect to focus textarea when enabled
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [disabled])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (disabled) {
        toast.error("Please wait for the model to finish its response!")
        return
      }
      const form = e.currentTarget.form
      if (form) {
        onSubmit(new Event("submit") as unknown as React.FormEvent<HTMLFormElement>)
      }
    }
  }

  const hasContent = value.trim().length > 0

  return (
    <div className="w-full bg-gradient-to-t from-white via-white to-white/0 pt-2">
      <div className="mx-auto max-w-3xl px-4 md:px-8 lg:px-12 pb-4">
        <div className="relative flex flex-col rounded-xl border bg-white shadow-[0_0_15px_rgba(0,0,0,0.1)]">
          <form onSubmit={onSubmit} className="flex items-start gap-2 p-2">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Send a message..."
              className={cn(
                "w-full resize-none px-3 py-2.5 transition-all duration-200 outline-none ring-0 focus:ring-0 border-0 bg-transparent text-base leading-relaxed",
                disabled && "bg-gray-50 cursor-not-allowed",
              )}
              style={{
                minHeight: "64px",
                maxHeight: "200px",
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
                  "p-2 rounded-lg transition-colors self-end mb-1",
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
                  "p-2 rounded-lg transition-colors self-end mb-1",
                  hasContent ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-gray-100 text-gray-400",
                  disabled && "opacity-50 cursor-not-allowed",
                )}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </form>
          
          <div
            className={cn(
              "overflow-hidden transition-all duration-500 ease-in-out border-t",
              showProgressBar ? "max-h-16 opacity-100" : "max-h-0 opacity-0",
              "bg-gray-50/50"
            )}
          >
            <div className="px-4 py-2">
              <ProgressBar steps={steps} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

