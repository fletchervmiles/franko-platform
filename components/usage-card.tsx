import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

interface UsageCardProps {
  title: string
  used: number
  total: number
  percentage: number
  infoTooltip?: string
}

export function UsageCard({ title, used, total, percentage, infoTooltip }: UsageCardProps) {
  // Determine color based on percentage
  const getStatusColor = (percentage: number) => {
    if (percentage < 60) return "bg-emerald-500"
    if (percentage < 85) return "bg-amber-500"
    return "bg-red-500"
  }

  const getTextColor = (percentage: number) => {
    if (percentage < 60) return "text-emerald-500"
    if (percentage < 85) return "text-amber-500"
    return "text-red-500"
  }

  const statusColor = getStatusColor(percentage)
  const textColor = getTextColor(percentage)

  return (
    <Card className="rounded-[6px] border bg-white shadow-sm">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          {title}
          {infoTooltip && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="px-4 py-3">
                  <p className="max-w-xs text-sm leading-relaxed">{infoTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold">{used.toLocaleString()}</span>
            <span className="text-muted-foreground ml-2 text-sm">/ {total.toLocaleString()}</span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full ${statusColor} transition-all duration-300`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">{Math.round(((total - used) / total) * 100)}% remaining</div>
            <div className={`text-sm font-medium ${textColor}`}>{percentage}% used</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

