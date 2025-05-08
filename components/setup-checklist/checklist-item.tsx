"use client"

import { useState } from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface ChecklistItemProps {
  label: string
  completed: boolean
  instructions?: string[]
  onExpand: () => void
  onCollapse: () => void
}

export function ChecklistItem({ label, completed, instructions = [], onExpand, onCollapse }: ChecklistItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpand = () => {
    if (!completed && instructions.length > 0) {
      const newExpandedState = !isExpanded
      setIsExpanded(newExpandedState)

      // Notify parent component about the expand/collapse action
      if (newExpandedState) {
        onExpand()
      } else {
        onCollapse()
      }
    }
  }

  const hasInstructions = instructions.length > 0

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div
        className={cn("flex items-center py-3 group", hasInstructions && !completed && "cursor-pointer")}
        onClick={toggleExpand}
      >
        <div className="relative w-6 h-6 mr-3 flex-shrink-0">
          <div
            className={cn(
              "w-5 h-5 rounded-full border-2 transition-colors duration-200",
              completed ? "border-blue-600 bg-blue-600" : "border-gray-300",
            )}
          >
            {completed && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center h-full"
              >
                <Check className="w-3 h-3 text-white" aria-hidden="true" />
              </motion.div>
            )}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-between">
          <span
            className={cn(
              "text-sm transition-all duration-200",
              completed
                ? "text-gray-500"
                : "text-black",
            )}
          >
            {label}
          </span>
          {hasInstructions && !completed && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand()
              }}
              className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 rounded-full p-1"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Hide instructions" : "Show instructions"}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && !completed && instructions.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              <div className="bg-gray-50 rounded-md p-3 text-sm">
                {/* Title removed as we now have structured content with Why and Steps sections */}
                <div className="space-y-2 text-black">
                  {instructions.map((instruction, index) => {
                    // Remove markdown syntax and extract content
                    let content = instruction

                    // Handle bold text (remove ** markers)
                    if (content.includes("**Why:**")) {
                      content = content.replace("**Why:**", "Why:")
                      return (
                        <p key={index} className="font-medium text-black">
                          {content}
                        </p>
                      )
                    }

                    if (content === "**Steps**") {
                      content = "Steps"
                      return (
                        <p key={index} className="font-medium text-black mt-2">
                          {content}
                        </p>
                      )
                    }

                    // Handle numbered steps
                    if (
                      content.startsWith("1.") ||
                      content.startsWith("2.") ||
                      content.startsWith("3.") ||
                      content.startsWith("4.") ||
                      content.startsWith("5.")
                    ) {
                      // Handle bold text within steps
                      content = content.replace(/\*\*([^*]+)\*\*/g, "$1")
                      return (
                        <p key={index} className="ml-4">
                          {content}
                        </p>
                      )
                    }

                    // Handle empty lines
                    if (content === "") {
                      return <div key={index} className="h-2"></div>
                    }

                    // Handle any remaining bold text
                    content = content.replace(/\*\*([^*]+)\*\*/g, "$1")
                    return <p key={index}>{content}</p>
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
