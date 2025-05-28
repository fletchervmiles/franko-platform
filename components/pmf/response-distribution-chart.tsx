"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFeedback } from "@/contexts/feedback-context"

export function ResponseDistributionChart() {
  const { responseDistribution, isLoading } = useFeedback()

  // Find the maximum count to scale the bars
  const maxCount = Math.max(...responseDistribution.map((item) => item.count), 1)

  // Calculate a nice rounded max value for the y-axis with more breathing room
  // Add 50% buffer and round up to nearest multiple of 20
  const buffer = maxCount * 0.5
  const yAxisMax = Math.ceil((maxCount + buffer) / 20) * 20

  // Generate y-axis tick values - use 5 ticks for better readability
  const yAxisTicks = Array.from({ length: 5 }, (_, i) => Math.round((yAxisMax / 4) * i))

  // Calculate total responses for percentage calculation
  const totalResponses = responseDistribution.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card className="border shadow-sm rounded-[6px] bg-white font-sans">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-800">Distribution</CardTitle>
        <p className="text-sm text-gray-500">Distribution of responses by PMF question</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
          </div>
        ) : (
          <div className="pt-4">
            <div className="flex h-72">
              {/* Y-axis */}
              <div className="flex flex-col justify-between pr-2 pt-2 pb-8">
                {yAxisTicks.reverse().map((tick, i) => (
                  <div key={i} className="flex items-center h-6">
                    <span className="text-xs text-gray-500 text-right w-8">{tick}</span>
                  </div>
                ))}
              </div>

              {/* Chart area with axes */}
              <div className="flex-1 relative pb-14">
                {/* Y-axis line */}
                <div className="absolute left-0 top-0 bottom-8 w-px bg-gray-300"></div>

                {/* X-axis line */}
                <div className="absolute left-0 right-0 bottom-8 h-px bg-gray-300"></div>

                {/* Horizontal grid lines - very subtle and thin */}
                <div className="absolute left-0 right-0 top-0 bottom-8">
                  {yAxisTicks.reverse().map((tick, i) => (
                    <div
                      key={i}
                      className="absolute w-full bg-gray-100"
                      style={{
                        bottom: `${(tick / yAxisMax) * 100}%`,
                        height: "1px",
                        opacity: 1,
                        transform: "scaleY(0.5)", // This makes the line appear thinner
                      }}
                    />
                  ))}
                </div>

                {/* Bars container - ensure minimum width for mobile */}
                <div className="absolute left-4 right-4 top-2 bottom-8 flex justify-around">
                  {responseDistribution.map((item, index) => {
                    // Calculate percentage for this item
                    const percentage = totalResponses > 0 ? Math.round((item.count / totalResponses) * 100) : 0

                    return (
                      <div key={index} className="flex flex-col items-center justify-end w-1/4">
                        {/* Count and percentage label above bar on same line */}
                        <div className="mb-1">
                          <span className="text-xs font-medium">
                            {item.count} <span className="text-gray-500">({percentage}%)</span>
                          </span>
                        </div>

                        {/* Bar */}
                        <div
                          className="w-16 rounded-t-sm transition-all duration-500 ease-in-out"
                          style={{
                            height: `${Math.max((item.count / yAxisMax) * 100, 1)}%`,
                            backgroundColor: item.color,
                          }}
                        />

                        {/* X-axis label */}
                        <div className="mt-2 text-xs text-center text-gray-600 absolute bottom-[-36px] w-24">
                          {item.label
                            .replace("disappointed", "Disappointed")
                            .split(" ")
                            .map((word, i) => (
                              <span key={i} className="block">
                                {word}
                              </span>
                            ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
