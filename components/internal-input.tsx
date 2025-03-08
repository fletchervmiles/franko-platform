"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp, Square, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import * as React from "react"

// Textarea Component
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = "Textarea"

// Scroll To Top Component
export function ScrollToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (!show) return null

  return (
    <Button
      variant="default"
      size="icon"
      className="fixed bottom-4 right-4 h-10 w-10 rounded-lg bg-gray-900 text-white shadow-lg"
      onClick={scrollToTop}
    >
      <ArrowUp className="h-5 w-5" />
      <span className="sr-only">Scroll to top</span>
    </Button>
  )
}

// Main Chat Input Component
interface InternalInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  stop?: () => void;
}

export function InternalInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  stop,
}: InternalInputProps) {
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

  return (
    <div className="w-full bg-background pt-2">
      <div className="mx-auto max-w-4xl pb-4">
        <div className="relative flex flex-col rounded-xl border bg-background shadow-[0_0_15px_rgba(0,0,0,0.05)] [&:has(:focus)]:shadow-[0_0_15px_rgba(0,0,0,0.1)] [&:has(:focus)]:border-transparent">
          <form onSubmit={onSubmit} className="flex flex-col gap-2 p-2 px-4">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={onChange}
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
              disabled={disabled}
            />
            <div className="flex justify-end items-center">
              <div className="flex gap-2 items-center">
                {disabled && stop && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={stop}
                    className="h-8 px-3 text-xs"
                  >
                    <Square className="h-3 w-3 mr-1" />
                    Stop
                  </Button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={disabled || value.trim().length === 0}
                >
                  {disabled ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ArrowUp className="h-3 w-3 mr-1" />}
                  {disabled ? "Thinking..." : "Send"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}