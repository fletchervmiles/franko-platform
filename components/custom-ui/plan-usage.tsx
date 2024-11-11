import { Clock, HourglassIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface UsageMetrics {
  totalLifetimeMinutes: number
  minutesUsedThisMonth: number
  remainingMinutes: number
  monthlyQuota: number
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours} hours, ${remainingMinutes} minutes`
}

export default function UsageOverview({ metrics }: { metrics: UsageMetrics }) {
  const percentageUsed = (metrics.minutesUsedThisMonth / metrics.monthlyQuota) * 100

  return (
    <Card className="w-full bg-white p-2">
      <CardHeader className="pb-6">
        <CardTitle className="text-lg font-semibold">Your Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-blue-500" />
                  Total Lifetime Minutes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-lg font-bold text-blue-700">
                  {formatMinutes(metrics.totalLifetimeMinutes)}
                </p>
                <p className="text-sm text-blue-600 mt-1">Your all-time usage of the service.</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-100 border-gray-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  Minutes Used This Month
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-lg font-bold text-gray-700">
                  {formatMinutes(metrics.minutesUsedThisMonth)}
                </p>
                <p className="text-sm text-gray-600 mt-1">Your usage for this month.</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold flex items-center">
                  <HourglassIcon className="w-4 h-4 mr-2 text-green-500" />
                  Minutes Available
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-lg font-bold text-green-700">
                  {formatMinutes(metrics.remainingMinutes)}
                </p>
                <p className="text-sm text-green-600 mt-1">Minutes left in your monthly quota.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}