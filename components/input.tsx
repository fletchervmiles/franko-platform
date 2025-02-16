"use client"

import { Textarea } from "@/components/ui/textarea"
import { ArrowUp } from "lucide-react"
import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  disabled?: boolean
}

export function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [textareaRef])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form) {
        onSubmit(new Event("submit") as unknown as React.FormEvent<HTMLFormElement>)
      }
    }
  }

  const hasContent = value.trim().length > 0

  return (
    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-white/0 pt-6">
      <div className="mx-auto max-w-3xl px-4 pb-6">
        <div className="relative flex flex-col rounded-xl border bg-white shadow-[0_0_15px_rgba(0,0,0,0.1)]">
          <form onSubmit={onSubmit} className="flex items-start gap-2 p-2">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Message Franko..."
              className={cn(
                "w-full resize-none px-2 py-1.5 transition-colors outline-none ring-0 focus:ring-0 border-0 bg-transparent",
                disabled && "bg-gray-50 cursor-not-allowed",
              )}
              style={{
                overflowY: "hidden",
                minHeight: "3rem",
              }}
              disabled={disabled}
            />
            <button
              type="submit"
              disabled={!hasContent || disabled}
              className={cn(
                "p-2 rounded-lg transition-colors mt-0.5",
                hasContent ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-gray-100 text-gray-400",
                disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

