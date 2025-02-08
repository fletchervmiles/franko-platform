"use client"

import { Textarea } from "@/components/ui/textarea"
import { ArrowUp } from 'lucide-react'
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
      textareaRef.current.style.height = "inherit"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form) {
        onSubmit(new Event('submit') as unknown as React.FormEvent<HTMLFormElement>)
      }
    }
  }

  const hasContent = value.trim().length > 0

  return (
    <div className="bg-white p-4 shadow-sm">
      <form onSubmit={onSubmit} className="mx-auto max-w-2xl">
        <div className="relative flex flex-col rounded-lg border border-gray-200 hover:border-gray-300 focus-within:border-gray-400 transition-colors">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder="Message Franko..."
            className={cn(
              "min-h-[24px] w-full resize-none rounded-t-lg px-4 py-3 pb-6 transition-colors outline-none ring-0 focus:ring-0 border-0",
              disabled && "bg-gray-100 cursor-not-allowed"
            )}
            rows={1}
            style={{ outline: 'none', boxShadow: 'none' }}
            disabled={disabled}
          />
          <div className="flex items-center justify-end px-2 py-1.5 border-t border-gray-100">
            <button
              type="submit"
              disabled={!hasContent || disabled}
              className={cn(
                "rounded-md p-1 transition-colors",
                hasContent 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-400',
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

