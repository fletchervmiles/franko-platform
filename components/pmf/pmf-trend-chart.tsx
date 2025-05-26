"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFeedback } from "@/contexts/feedback-context"
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Info, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useEffect } from "react"

// Change Indicator component
function ChangeIndicator({ data }: { data: { score: number | null }[] }) {
  const valid = data.filter((p) => p.score !== null)
  if (valid.length < 2) {
    return (
      <span className="text-xs text-gray-400" title="Not enough data">
        N/A
      </span>
    )
  }

  const delta = valid[valid.length - 1].score! - valid[0].score!
  const up = delta > 0

  return (
    <span
      className={`flex items-center text-xs font-medium 
                ${up ? "text-emerald-600" : "text-rose-600"}`}
      title={`Change in 14-day PMF average from start to end of period`}
    >
      {up ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
      {Math.abs(delta).toFixed(0)}%
    </span>
  )
}

export function TrendChart() {
  const { trendData, isLoading, selectedTimePeriod } = useFeedback()

  // Log the first few items of trendData to see its structure
  useEffect(() => {
    if (trendData && trendData.length > 0) {
      console.table(trendData.slice(0, 3))
    }
  }, [trendData])

  // Get time period description
  const getTimePeriodDescription = () => {
    switch (selectedTimePeriod) {
      case "Monthly":
        return "past month"
      case "Quarterly":
        return "past 3 months"
      case "6 Months":
        return "past 6 months"
      default:
        return "past month"
    }
  }

  // Get time period label
  const getTimeUnitLabel = () => {
    switch (selectedTimePeriod) {
      case "Monthly":
        return "Dots – Weekly (14-day avg.)"
      case "Quarterly":
        return "Dots – Fortnightly (14-day avg.)"
      case "6 Months":
        return "Dots – Monthly (14-day avg.)"
      default:
        return "Dots – Weekly (14-day avg.)"
    }
  }

  // Helper function to estimate date range for a data point
  const getDateRange = (dateStr: string) => {
    // Parse the date string
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Handle different date formats based on time period
    let endMonth, endDay

    if (selectedTimePeriod === "6 Months") {
      // For 6 Months view, we only have month (e.g., "Mar")
      endMonth = dateStr
      // Use last day of month as approximation
      const monthIndex = months.indexOf(endMonth)
      const year = new Date().getFullYear()
      const lastDay = new Date(year, monthIndex + 1, 0).getDate()
      endDay = lastDay
    } else {
      // For Monthly and Quarterly views, we have "Month Day" format (e.g., "Mar 21")
      const parts = dateStr.split(" ")
      endMonth = parts[0]
      endDay = Number.parseInt(parts[1] || "1")
    }

    // Create end date
    const monthIndex = months.indexOf(endMonth)
    const year = new Date().getFullYear()
    const endDate = new Date(year, monthIndex, endDay)

    // Create start date (14 days before end date)
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 13) // 14 days including end date

    // Format dates
    const startMonth = months[startDate.getMonth()]
    const startDay = startDate.getDate()

    return {
      startDate: startDate,
      endDate: endDate,
      formattedRange: `${startMonth} ${startDay} – ${endMonth} ${endDay} (14 days)`,
    }
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null

    const dataPoint = payload[0].payload

    if (!dataPoint || dataPoint.score === null) {
      return (
        <div className="bg-black text-white p-2 rounded-md text-xs">
          <p className="text-gray-300">Insufficient data</p>
        </div>
      )
    }

    // Get date range
    const dateRange = getDateRange(dataPoint.date)

    // Use the available fields from the data
    // If responses and very aren't available, we'll just show what we have
    const { date, score, responses } = dataPoint

    return (
      <div className="bg-black text-white p-3 rounded-md text-xs">
        <p className="font-medium mb-1">{dateRange.formattedRange}</p>
        {responses !== undefined && <p className="mb-1">{`Responses: ${responses}`}</p>}
        <p>{`PMF Score: ${score}%`}</p>
      </div>
    )
  }

  // Check if we have any valid data points
  const hasValidData = trendData.some((point: { date: string; score: number | null; responses: number }) => point.score !== null)

  return (
    <Card className="border shadow-sm rounded-[6px] bg-white font-sans">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center w-full">
          <CardTitle className="text-lg font-semibold text-gray-800">Trend</CardTitle>
          {!isLoading && <ChangeIndicator data={trendData} />}
        </div>
        <div className="text-sm text-gray-500">
          <div className="flex items-center flex-wrap">
            <span>PMF score over the {getTimePeriodDescription()}</span>
            <span className="text-xs text-gray-400 ml-1">(14-day rolling average</span>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="inline-flex ml-1 rounded-full p-0.5 hover:bg-gray-100">
                    <Info className="h-3 w-3 text-gray-400" />
                    <span className="sr-only">Rolling Average Information</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-black text-white border-black max-w-xs p-3">
                  <div className="font-medium mb-2">14-day rolling average</div>
                  <ul className="space-y-2 text-xs">
                    <li>
                      Each day's value takes all survey responses from that day plus the previous 13 days, calculates
                      the average PMF score, and then plots this number as one point in the line.
                    </li>
                    <li>
                      If any 14-day period has fewer than 15 total responses, the data isn't shown (to avoid unreliable
                      results).
                    </li>
                    <li>
                      For readability, dots are only shown weekly (Monthly view), fortnightly (Quarterly view), or
                      monthly (6-Month view). Each dot always represents a full 14 days.
                    </li>
                    <li className="italic text-gray-300">
                      Example: A dot at Mar 21 averages all responses from Mar 8–Mar 21.
                    </li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-xs text-gray-400">)</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
          </div>
        ) : !hasValidData ? (
          <div className="flex justify-center items-center h-72 text-gray-500">
            <div className="text-center">
              <p>Not enough data to display trend</p>
              <p className="text-xs text-gray-400 mt-1">Minimum 15 responses required per data point</p>
            </div>
          </div>
        ) : (
          <div className="h-72 pt-4 relative">
            <ResponsiveContainer width="100%" height="92%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  dy={10}
                />
                <YAxis
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  domain={[0, 100]}
                  width={40}
                  tickFormatter={(value: number) => `${value}%`}
                />
                <RechartsTooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "#10b981", strokeWidth: 1, strokeDasharray: "3 3" }}
                  wrapperStyle={{ zIndex: 100 }}
                  allowEscapeViewBox={{ x: false, y: true }}
                />

                {/* 40% PMF Threshold line */}
                <ReferenceLine
                  y={40}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  label={{
                    value: "40% PMF Threshold",
                    position: "insideBottomRight",
                    fill: "#10b981",
                    fontSize: 12,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                  connectNulls={false} // This ensures the line breaks for null values
                  isAnimationActive={false} // Disable animation for better tooltip performance
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 text-center mt-2">{getTimeUnitLabel()}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
