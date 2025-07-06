"use client"

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
  const getCompletionRateColor = (rate: number) => {
    if (rate > 90) return "bg-[#E4F222]"
    if (rate >= 60) return "bg-yellow-50"
    return "bg-red-50"
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Responses Card */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-sm font-medium text-gray-500 mb-1">Responses</h3>
        <p className="text-2xl font-semibold">{totalResponses.toLocaleString()}</p>
      </div>

      {/* Total Words Card */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-sm font-medium text-gray-500 mb-1">Total Customer Words</h3>
        <p className="text-2xl font-semibold">
          <span className="bg-[#F5FF78] px-2 py-0.5 rounded">{totalWords.toLocaleString()}</span>
        </p>
      </div>

      {/* Completion Rate Card */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-sm font-medium text-gray-500 mb-1">Completion Rate</h3>
        <p className="text-2xl font-semibold">
          <span className={`${getCompletionRateColor(completionRate)} px-2 py-0.5 rounded`}>
            {completionRate.toFixed(1)}%
          </span>
        </p>
      </div>
    </div>
  )
} 