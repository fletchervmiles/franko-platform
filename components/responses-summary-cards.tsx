"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BarChart, FileText, Users } from "lucide-react"

interface ResponsesSummaryCardsProps {
  totalResponses: number
  totalWords: number
  completionRate: number
}

export function ResponsesSummaryCards({ 
  totalResponses, 
  totalWords, 
  completionRate 
}: ResponsesSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Responses Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Responses</p>
              <p className="text-2xl font-bold">{totalResponses.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Words Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Words</p>
              <p className="text-2xl font-bold">
                <span className="bg-green-50 px-2 py-0.5 rounded text-green-600">
                  {totalWords.toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Rate Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <BarChart className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold">
                <span className={`px-2 py-0.5 rounded ${
                  completionRate > 90 
                    ? "bg-green-50 text-green-600" 
                    : completionRate >= 60 
                    ? "bg-yellow-50 text-yellow-600" 
                    : "bg-red-50 text-red-600"
                }`}>
                  {completionRate.toFixed(1)}%
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 