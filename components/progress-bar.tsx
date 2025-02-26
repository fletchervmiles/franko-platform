import { Check, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

export type Step = {
  label: string
  status: "completed" | "in-review" | "pending"
}

interface ProgressBarProps {
  steps: Step[]
  className?: string
  isUpdating?: boolean
}

export function ProgressBar({ steps, className, isUpdating = false }: ProgressBarProps) {
  return (
    <div className={cn(
      "w-full max-w-2xl mx-auto px-12 py-2 transition-opacity duration-300", 
      isUpdating && "opacity-80",
      className
    )}>
      <div className="relative flex justify-between">
        {/* Line connecting the circles */}
        <div className="absolute inset-0 flex" style={{ top: "9px" }}>
          <div className="w-[calc(100%-10px)] mx-auto h-[1px] bg-gray-200" />
        </div>

        {/* Steps */}
        {steps.map((step, index) => (
          <div key={index} className="relative flex items-center">
            <div
              className={cn(
                "relative w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white z-10 transition-all duration-300 ease-in-out",
                step.status === "completed" && "border-[#0070f3] bg-[#0070f3]",
                step.status === "in-review" && "border-[#0070f3] bg-[#e6f0ff]",
                step.status === "pending" && "border-gray-300"
              )}
            >
              {step.status === "completed" && <Check className="h-3 w-3 text-white" />}
              {step.status === "in-review" && (
                <Circle className="h-1.5 w-1.5 fill-[#0070f3] text-[#0070f3]" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

