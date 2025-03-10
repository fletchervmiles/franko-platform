import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface UsageData {
  responses: {
    used: number
    total: number
    percentage: number
  }
  conversationPlans: {
    used: number
    total: number
    percentage: number
  }
  qaMessages: {
    used: number
    total: number
    percentage: number
  }
}

interface UsageSummaryProps {
  usageData: UsageData
}

export function UsageSummary({ usageData }: UsageSummaryProps) {
  // Calculate overall usage
  const totalUsed = usageData.responses.used + usageData.conversationPlans.used + usageData.qaMessages.used
  const totalAvailable = usageData.responses.total + usageData.conversationPlans.total + usageData.qaMessages.total
  const overallPercentage = Math.round((totalUsed / totalAvailable) * 100)

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

  const statusColor = getStatusColor(overallPercentage)
  const textColor = getTextColor(overallPercentage)

  return (
    <Card className="rounded-[6px] border bg-white shadow-sm">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold text-foreground">Overall Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline">
              <span className="text-2xl font-semibold">{totalUsed.toLocaleString()}</span>
              <span className="text-muted-foreground ml-2 text-sm">/ {totalAvailable.toLocaleString()} credits</span>
            </div>
            <div className={`text-sm font-medium ${textColor}`}>{overallPercentage}% used</div>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full ${statusColor} transition-all duration-300`}
              style={{ width: `${overallPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Responses</span>
                <span className={`text-sm font-medium ${getTextColor(usageData.responses.percentage)}`}>
                  {usageData.responses.percentage}%
                </span>
              </div>
              <div className="h-1 w-full mt-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full ${getStatusColor(usageData.responses.percentage)}`}
                  style={{ width: `${usageData.responses.percentage}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plans</span>
                <span className={`text-sm font-medium ${getTextColor(usageData.conversationPlans.percentage)}`}>
                  {usageData.conversationPlans.percentage}%
                </span>
              </div>
              <div className="h-1 w-full mt-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full ${getStatusColor(usageData.conversationPlans.percentage)}`}
                  style={{ width: `${usageData.conversationPlans.percentage}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Q&A</span>
                <span className={`text-sm font-medium ${getTextColor(usageData.qaMessages.percentage)}`}>
                  {usageData.qaMessages.percentage}%
                </span>
              </div>
              <div className="h-1 w-full mt-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full ${getStatusColor(usageData.qaMessages.percentage)}`}
                  style={{ width: `${usageData.qaMessages.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

