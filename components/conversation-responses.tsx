import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InfoIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ResponseCard } from "./response-card"

interface Response {
  name: string
  email: string
  completionRate: number
  completionDate: string
  summary: string
  transcript: string
}

interface ConversationResponsesProps {
  responses: number
  totalCustomerWords: number
  completionRate: number
  responseData: Response[]
}

export function ConversationResponses({
  responses,
  totalCustomerWords,
  completionRate,
  responseData,
}: ConversationResponsesProps) {
  const getCompletionRateColor = (rate: number) => {
    if (rate > 90) return "bg-green-50"
    if (rate >= 60) return "bg-yellow-50"
    return "bg-red-50"
  }

  // Calculate words for each response
  const getWordCount = (text: string) => {
    return text.split(/\s+/).filter((word) => word.length > 0).length
  }

  return (
    <Card className="rounded-[6px] border bg-[#FAFAFA] shadow-sm">
      <CardHeader className="pb-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Conversation Responses</h2>
          <p className="text-sm text-gray-500">Overview of responses collected from your conversations.</p>
          <div className="pt-2 flex items-center space-x-2">
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm px-3 py-1.5 transition-all duration-200">
              Chat with Response Data
            </Button>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="ghost" size="icon" className="p-0 h-5 w-5">
                    <InfoIcon className="h-5 w-5 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" className="bg-black text-white border-black">
                  <p>Chat with your response data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Responses</h3>
            <p className="text-2xl font-semibold">{responses.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Customer Words</h3>
            <p className="text-2xl font-semibold">
              <span className="bg-green-50 px-2 py-0.5 rounded">{totalCustomerWords.toLocaleString()}</span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Completion Rate</h3>
            <p className="text-2xl font-semibold">
              <span className={`${getCompletionRateColor(completionRate)} px-2 py-0.5 rounded`}>
                {completionRate.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>

        <div className="rounded-[6px] border bg-white shadow-sm overflow-hidden">
          {responseData.map((response, index) => (
            <ResponseCard
              key={index}
              {...response}
              isLast={index === responseData.length - 1}
              customerWords={getWordCount(response.transcript)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

